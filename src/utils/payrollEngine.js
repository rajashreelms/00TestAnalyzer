import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// ─── PAYROLL COMPARISON CONCEPT ────────────────────────────────────────────
// /559 ("Transfer to bank") is the actual Net Pay per employee in payroll data.
// /101 ("Gross amount") is the Gross Pay per employee in payroll data.
// The WT filter file lists the wage types that bifurcate/explain these totals.
// This tool compares /559 and /101 between current and previous month, then
// breaks down which wage types from the filter file caused the variance.
// Reconciliation: Sum of (filter WT amounts × multipliers) should equal the target WT.
// ────────────────────────────────────────────────────────────────────────────

const NET_PAY_WT = 'Transfer to bank'; // /559
const GROSS_WT = 'Gross amount';       // /101

export function parseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const ext = file.name.split('.').pop().toLowerCase();
    const isText = ext === 'csv' || ext === 'txt' || ext === 'tsv';

    reader.onload = (e) => {
      try {
        let wb;
        if (isText) {
          const text = e.target.result;
          const firstLine = text.split('\n')[0] || '';
          let sep = ',';
          if (firstLine.includes(';')) sep = ';';
          else if (firstLine.includes('\t')) sep = '\t';
          else if (firstLine.includes('|')) sep = '|';
          wb = XLSX.read(text, { type: 'string', FS: sep });
        } else {
          wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        }
        let json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        json = normalizeColumns(json);
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    if (isText) reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
  });
}

// ─── Column normalization ──────────────────────────────────────────────────

const COLUMN_MAP = {
  'Employee ID': 'ID', 'employee id': 'ID', 'Emp ID': 'ID', 'EmpID': 'ID',
  'Employee Name': 'Name', 'employee name': 'Name', 'Emp Name': 'Name', 'EmpName': 'Name',
  'Component Type': 'Componenet Type', 'component type': 'Componenet Type',
  'Componenet Type': 'Componenet Type',
  'wage type': 'Wage Type', 'WT': 'Wage Type', 'Wage type': 'Wage Type',
  'wage type long text': 'Wage Type Long Text',
};

function normalizeColumns(json) {
  if (!json.length) return json;
  const renames = {};
  for (const key of Object.keys(json[0])) {
    const clean = key.replace(/[\uFEFF\u200B\u00A0]/g, '').trim();
    if (clean !== key) renames[key] = COLUMN_MAP[clean] || clean;
    else if (COLUMN_MAP[key] && key !== COLUMN_MAP[key]) renames[key] = COLUMN_MAP[key];
  }
  if (!Object.keys(renames).length) return json;
  return json.map((row) => {
    const out = {};
    for (const [k, v] of Object.entries(row)) out[renames[k] || k] = v;
    return out;
  });
}

// ─── Number parsing (handles European format: "40 737,59") ─────────────────

function parseNum(val) {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  // European format: spaces as thousand sep, comma as decimal
  let s = String(val).trim();
  // If contains comma and no period -> European format
  if (s.includes(',') && !s.includes('.')) {
    s = s.replace(/\s/g, '').replace(',', '.');
  } else {
    // Standard format or already clean
    s = s.replace(/\s/g, '').replace(/,/g, '');
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

// ─── Filter file parsing ───────────────────────────────────────────────────

export function parseFilterFile(json) {
  const df = { e: [], d: [], n: [], a: [] };
  const wtCols = { earn: [], ded: [], all: [] };
  const multipliers = {};
  const wtCodeMap = {}; // WT Long Text → WT short code from filter file
  const hasMultiplierColumn = 'Amount Multiplied By' in (json[0] || {});

  json.forEach((r) => {
    const wt = (r['Wage Type Long Text'] || '').trim();
    const c = (r['Componenet Type'] || '').trim();
    if (!wt) return;
    df.a.push(wt);
    wtCols.all.push(wt);
    // Capture WT code if available
    const code = r['Wage Type'] !== undefined && r['Wage Type'] !== null ? String(r['Wage Type']).trim() : '';
    if (code) wtCodeMap[wt] = code;
    let mult = 1;
    if (hasMultiplierColumn) {
      const multVal = r['Amount Multiplied By'];
      if (multVal !== undefined && multVal !== null && multVal !== '') {
        mult = parseNum(multVal);
      }
    }
    multipliers[wt] = mult;
    if (c === 'Earnings') { df.e.push(wt); wtCols.earn.push(wt); }
    else if (c === 'Deduction') { df.d.push(wt); wtCols.ded.push(wt); }
    else if (c === 'Net Pay') df.n.push(wt);
  });

  return { df, wtCols, multipliers, hasMultiplierColumn, wtCodeMap };
}

// ─── Data helpers ──────────────────────────────────────────────────────────

function sumRecords(data) {
  const g = {};
  data.forEach((r) => {
    const id = String(r.ID).trim();
    const wt = (r['Wage Type Long Text'] || '').trim();
    const k = `${id}|||${wt}`;
    if (!g[k]) g[k] = { ID: id, Name: r.Name, 'Wage Type Long Text': wt, 'Wage Type': r['Wage Type'] || '', Amount: 0 };
    g[k].Amount += parseNum(r.Amount);
  });
  return Object.values(g);
}

// Build a lookup map from Wage Type Long Text → Wage Type (short code)
function buildWTCodeMap(data) {
  const map = {};
  data.forEach((r) => {
    const wt = (r['Wage Type Long Text'] || '').trim();
    const code = r['Wage Type'] !== undefined && r['Wage Type'] !== null ? String(r['Wage Type']).trim() : '';
    if (wt && code && !map[wt]) map[wt] = code;
  });
  return map;
}

function groupById(data) {
  const g = {};
  data.forEach((r) => {
    const id = String(r.ID).trim();
    if (!g[id]) g[id] = [];
    g[id].push(r);
  });
  return g;
}

function getRawAmt(entries, wt) {
  return entries
    .filter((r) => (r['Wage Type Long Text'] || '').trim() === wt)
    .reduce((s, r) => s + parseNum(r.Amount), 0);
}

function getWTAmt(entries, wt, multipliers) {
  const amt = getRawAmt(entries, wt);
  const mult = multipliers[wt] !== undefined ? multipliers[wt] : 1;
  return amt * mult;
}

function getComponentType(wt, df) {
  if (!df) return 'Unknown';
  if (df.e.includes(wt)) return 'Earnings';
  if (df.d.includes(wt)) return 'Deduction';
  if (df.n.includes(wt)) return 'Net Pay';
  return 'Other';
}

// ─── Main analysis ─────────────────────────────────────────────────────────

export function analyze(d1Raw, d2Raw, threshold, df, wtCols, multipliers) {
  // Build WT code lookup map from both periods' raw data
  const wtCodeMap = { ...buildWTCodeMap(d1Raw), ...buildWTCodeMap(d2Raw) };

  // Sum ALL records (including /559, /101) for lookup
  const all1 = sumRecords(d1Raw);
  const all2 = sumRecords(d2Raw);

  // Filter to only WT-filter wage types for bifurcation analysis
  const filterWTs = df ? df.a : [];
  let p1 = filterWTs.length ? all1.filter((r) => filterWTs.includes(r['Wage Type Long Text'])) : all1;
  let p2 = filterWTs.length ? all2.filter((r) => filterWTs.includes(r['Wage Type Long Text'])) : all2;

  // /559 analysis (all WTs for reconciliation)
  const net559 = calcNetForWT(NET_PAY_WT, p1, p2, all1, all2, threshold, df, wtCols, multipliers, wtCodeMap, false);
  // /101 analysis (earnings only for reconciliation)
  const net101 = calcNetForWT(GROSS_WT, p1, p2, all1, all2, threshold, df, wtCols, multipliers, wtCodeMap, true);

  const detailed = calcDetailed(p1, p2, threshold, multipliers, df, wtCodeMap);
  const wtChanges = calcWTChanges(p1, p2, multipliers, df, wtCodeMap);

  return {
    active: net559.active,
    zeroPay: net559.zeroPay,
    active101: net101.active,
    zeroPay101: net101.zeroPay,
    detailed,
    removed: wtChanges.removed,
    added: wtChanges.added,
    wtCodeMap,
  };
}

// ─── Active Pay comparison (generic for any target WT: /559, /101, etc.) ──

function calcNetForWT(targetWT, p1, p2, all1, all2, threshold, df, wtCols, multipliers, wtCodeMap, earningsOnlyRecon) {
  const g1 = groupById(p1);    // filtered WTs only
  const g2 = groupById(p2);
  const gAll1 = groupById(all1); // ALL WTs (to find target WT)
  const gAll2 = groupById(all2);
  const active = [];
  const zeroPay = [];
  const hasFilter = df && df.a.length > 0;

  // For /101 gross reconciliation, only use earnings WTs
  const reconWTs = hasFilter
    ? (earningsOnlyRecon ? wtCols.earn : wtCols.all)
    : [];

  // All employee IDs from full data
  const ids = new Set([...Object.keys(gAll1), ...Object.keys(gAll2)]);

  ids.forEach((id) => {
    const allE1 = gAll1[id] || [];
    const allE2 = gAll2[id] || [];
    if (!allE1.length || !allE2.length) return;

    const e1 = g1[id] || [];
    const e2 = g2[id] || [];
    const nm = allE1.length ? allE1[0].Name : allE2[0].Name;

    // Target WT amount from raw data
    const p1net = getRawAmt(allE1, targetWT);
    const p2net = getRawAmt(allE2, targetWT);

    // Calculated gross from filter WTs (sum of amounts × multipliers)
    // For /101: only earnings; for /559: all WTs
    let p1gross = 0, p2gross = 0;
    if (hasFilter) {
      reconWTs.forEach((wt) => {
        p1gross += getWTAmt(e1, wt, multipliers);
        p2gross += getWTAmt(e2, wt, multipliers);
      });
    }

    // Reconciliation: calculated gross vs target WT
    const p1ReconDiff = hasFilter ? p1gross - p1net : 0;
    const p2ReconDiff = hasFilter ? p2gross - p2net : 0;

    const v = p1net - p2net;
    const vp = p2net ? (v / p2net) * 100 : (p1net !== 0 ? 100 : 0);

    if (p1net === 0) {
      zeroPay.push({ id, nm, p2net, p1net: 0 });
      return;
    }

    // Per-WT diffs (from filter WTs — show all for column display)
    const wtDiffs = {};
    if (hasFilter) {
      wtCols.all.forEach((wt) => {
        const a1 = getWTAmt(e1, wt, multipliers);
        const a2 = getWTAmt(e2, wt, multipliers);
        if (a1 !== 0 || a2 !== 0) wtDiffs[wt] = a1 - a2;
      });
    }

    // Variance reconciliation: does sum of recon WT diffs explain the target variance?
    const varReconDiff = hasFilter ? (p1gross - p2gross) - v : 0;

    // Build structured wage type breakdown: { name, wtCode, p1amt, p2amt, diff, compType }
    const wtBreakdown = [];
    let chg = 0;
    if (hasFilter) {
      wtCols.all.forEach((wt) => {
        const a1 = getWTAmt(e1, wt, multipliers);
        const a2 = getWTAmt(e2, wt, multipliers);
        if (a1 !== 0 || a2 !== 0) {
          const diff = a1 - a2;
          const compType = getComponentType(wt, df);
          wtBreakdown.push({ name: wt, wtCode: wtCodeMap[wt] || '', p1amt: a1, p2amt: a2, diff, compType });
          if (a1 !== 0 && a2 !== 0) chg++;
        }
      });
      // Sort by absolute current amount descending
      wtBreakdown.sort((a, b) => Math.abs(b.p1amt) - Math.abs(a.p1amt));
    }

    active.push({
      id, nm, p2net, p1net, v, vp,
      st: Math.abs(vp) > threshold ? 'Discrepancy' : 'Approved',
      wtDiffs,
      p1GrossToNetDiff: p1ReconDiff,
      p2GrossToNetDiff: p2ReconDiff,
      varReconDiff,
      wtBreakdown, cc: chg,
    });
  });

  return { active, zeroPay };
}

// ─── Detailed WT breakdown (grouped by employee) ──────────────────────────

function calcDetailed(p1, p2, threshold, multipliers, df, wtCodeMap) {
  const g1 = groupById(p1);
  const g2 = groupById(p2);
  const detMap = {};
  const ids = new Set([...Object.keys(g1), ...Object.keys(g2)]);

  ids.forEach((id) => {
    const e1 = g1[id] || [];
    const e2 = g2[id] || [];
    if (!e1.length && !e2.length) return;
    const nm = e1.length ? e1[0].Name : (e2.length ? e2[0].Name : 'Unknown');
    const wts = new Set([...e1.map((r) => r['Wage Type Long Text']), ...e2.map((r) => r['Wage Type Long Text'])]);

    let empTotalA1 = 0, empTotalA2 = 0;
    const empWtRows = [];

    wts.forEach((wt) => {
      const key = `${id}__${wt}`;
      if (detMap[key]) return;

      const a1 = getWTAmt(e1, wt, multipliers);
      const a2 = getWTAmt(e2, wt, multipliers);
      if (a1 === 0 && a2 === 0) return;
      const v = a1 - a2;
      const vp = a2 ? (v / a2) * 100 : (a1 !== 0 ? 100 : 0);
      const mult = multipliers[wt] !== undefined ? multipliers[wt] : 1;
      const compType = getComponentType(wt, df);

      empTotalA1 += a1;
      empTotalA2 += a2;

      const row = {
        id, nm, wt, wtCode: wtCodeMap[wt] || '', mult, a1, a2, v, vp, compType,
        st: Math.abs(vp) > threshold ? 'Discrepancy' : 'Approved',
        isGroupHeader: false,
      };
      detMap[key] = row;
      empWtRows.push(row);
    });

    if (empWtRows.length > 0) {
      const empTotalV = empTotalA1 - empTotalA2;
      const empTotalVp = empTotalA2 ? (empTotalV / empTotalA2) * 100 : (empTotalA1 !== 0 ? 100 : 0);
      detMap[`${id}__SUMMARY`] = {
        id, nm, wt: `-- TOTAL (${empWtRows.length} wage types) --`,
        mult: '', a1: empTotalA1, a2: empTotalA2, v: empTotalV, vp: empTotalVp,
        compType: 'Summary',
        st: Math.abs(empTotalVp) > threshold ? 'Discrepancy' : 'Approved',
        isGroupHeader: true,
        wtCount: empWtRows.length,
        discCount: empWtRows.filter((r) => r.st === 'Discrepancy').length,
      };
    }
  });

  const rows = Object.values(detMap);
  rows.sort((a, b) => {
    const idCmp = String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
    if (idCmp !== 0) return idCmp;
    if (a.isGroupHeader && !b.isGroupHeader) return -1;
    if (!a.isGroupHeader && b.isGroupHeader) return 1;
    return a.wt.localeCompare(b.wt);
  });

  return rows;
}

// ─── WT Changes (removed / added) ─────────────────────────────────────────

function calcWTChanges(p1, p2, multipliers, df, wtCodeMap) {
  const removed = [];
  const added = [];
  const g1 = groupById(p1);
  const g2 = groupById(p2);
  const allIds = new Set([...Object.keys(g1), ...Object.keys(g2)]);

  allIds.forEach((id) => {
    const e1 = g1[id] || [];
    const e2 = g2[id] || [];
    const wt1Set = new Set(e1.map((r) => r['Wage Type Long Text']));
    const wt2Set = new Set(e2.map((r) => r['Wage Type Long Text']));
    const empName = e1.length > 0 ? e1[0].Name : (e2.length > 0 ? e2[0].Name : 'Unknown');

    e2.forEach((record) => {
      const wt = record['Wage Type Long Text'];
      if (!wt1Set.has(wt)) {
        const amt = parseNum(record.Amount);
        const mult = multipliers[wt] !== undefined ? multipliers[wt] : 1;
        const impact = amt * mult;
        removed.push({
          id, nm: empName, wt, wtCode: wtCodeMap[wt] || '', compType: getComponentType(wt, df),
          p2amt: amt, mult, impact,
          note: impact > 0 ? 'Earning removed - reduces income' :
                impact < 0 ? 'Deduction removed - increases income' :
                'Neutral component removed',
        });
      }
    });

    e1.forEach((record) => {
      const wt = record['Wage Type Long Text'];
      if (!wt2Set.has(wt)) {
        const amt = parseNum(record.Amount);
        const mult = multipliers[wt] !== undefined ? multipliers[wt] : 1;
        const impact = amt * mult;
        added.push({
          id, nm: empName, wt, wtCode: wtCodeMap[wt] || '', compType: getComponentType(wt, df),
          p1amt: amt, mult, impact,
          note: impact > 0 ? 'New earning added - increases income' :
                impact < 0 ? 'New deduction added - reduces income' :
                'Neutral component added',
        });
      }
    });
  });

  return { removed, added };
}

// ─── Formatting ────────────────────────────────────────────────────────────

export function fmt(n) {
  return Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Excel Export (with color-coded styling matching UI palette) ────────────

// Color palette matching the React UI
const COLORS = {
  primaryBg: '1A73E8',   // Blue header
  primaryFg: 'FFFFFF',
  earningBg: '1E8E3E',   // Green
  deductBg: 'C62828',    // Red
  reconBg: '6D4C00',     // Brown
  warningBg: 'FFF8E1',   // Light yellow
  warningBorder: 'F9AB00',
  errorBg: 'FCE8E8',     // Light red
  errorText: 'C62828',
  successBg: 'E6F4EA',   // Light green
  successText: '1E8E3E',
  summaryBg: 'F5F5F5',   // Light grey for summary rows
  discrepancyBg: 'FFF3E0', // Orange tint
};

function styleHeader(ws, colCount, bgColor = COLORS.primaryBg) {
  for (let c = 0; c < colCount; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    if (!ws[addr]) continue;
    ws[addr].s = {
      fill: { fgColor: { rgb: bgColor } },
      font: { bold: true, color: { rgb: COLORS.primaryFg }, sz: 11 },
      alignment: { horizontal: 'center', wrapText: true },
      border: {
        bottom: { style: 'thin', color: { rgb: '000000' } },
      },
    };
  }
}

function styleDataCells(ws, data, colCount, rowStyleFn) {
  for (let r = 0; r < data.length; r++) {
    const style = rowStyleFn ? rowStyleFn(data[r], r) : null;
    for (let c = 0; c < colCount; c++) {
      const addr = XLSX.utils.encode_cell({ r: r + 1, c }); // +1 for header
      if (!ws[addr]) continue;
      if (style) ws[addr].s = style;
    }
  }
}

function setColWidths(ws, widths) {
  ws['!cols'] = widths.map((w) => ({ wch: w }));
}


export function exportToExcel(nd, zd, dd, rmd, add, n1, n2, wtCols, nd101, zd101, wtCodeMap) {
  const wc = wtCodeMap || {};
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Active Net Pay ──
  const activeComment = `[/559 Comparison] Each row = one employee. /559 (Transfer to bank) is compared between ${n1} and ${n2}. Earnings diffs (green) and Deduction diffs (red) show which tracked WTs changed. Recon = Sum(WT×Mult) - /559. Status = Discrepancy if variance % exceeds threshold.`;
  const ne = nd.map((r) => {
    const row = {
      'ID': r.id, 'Employee': r.nm,
      [`${n2} /559`]: r.p2net,
      [`${n1} /559`]: r.p1net,
      '/559 Variance': r.v,
      'Variance %': r.vp.toFixed(2) + '%',
    };
    wtCols.earn.forEach((wt) => (row[`[E] ${wc[wt] ? wc[wt] + ' - ' : ''}${wt}`] = r.wtDiffs[wt] || 0));
    wtCols.ded.forEach((wt) => (row[`[D] ${wc[wt] ? wc[wt] + ' - ' : ''}${wt}`] = r.wtDiffs[wt] || 0));
    row[`${n1} Recon (Calc-/559)`] = r.p1GrossToNetDiff;
    row[`${n2} Recon (Calc-/559)`] = r.p2GrossToNetDiff;
    row['Var Recon Diff'] = r.varReconDiff;
    row['Status'] = r.st;

    // WT Bifurcation: detailed breakdown per employee
    const bd = r.wtBreakdown || [];
    const calcTotal = bd.reduce((s, w) => s + w.p1amt, 0);
    const lines = [
      `/559 Bank Transfer: ${fmt(r.p1net)}`,
      `Calc Total: ${fmt(calcTotal)} | ${r.cc} WT(s) changed`,
      '---',
    ];
    bd.forEach((w) => {
      const tag = w.compType === 'Earnings' ? '[E]' : w.compType === 'Deduction' ? '[D]' : '[?]';
      const codePrefix = w.wtCode ? `/${w.wtCode} ` : '';
      const diffStr = w.diff !== 0 ? ` (diff: ${w.diff > 0 ? '+' : ''}${fmt(w.diff)})` : '';
      lines.push(`${tag} ${codePrefix}${w.name}: ${fmt(w.p1amt)}${diffStr}`);
    });
    row['WT Bifurcation (Current)'] = lines.join('\n');

    // Variance driver comment
    const topChanges = bd
      .filter((w) => w.diff !== 0)
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
      .slice(0, 3);
    if (r.st === 'Discrepancy' && topChanges.length > 0) {
      const drivers = topChanges.map((w) => `${w.name} ${w.diff > 0 ? '+' : ''}${fmt(w.diff)}`).join('; ');
      row['Comment'] = `Variance of ${r.vp.toFixed(2)}% exceeds threshold. Top drivers: ${drivers}`;
    } else if (r.st === 'Discrepancy') {
      row['Comment'] = `Variance of ${r.vp.toFixed(2)}% exceeds threshold. Review wage type diffs.`;
    } else {
      row['Comment'] = 'Within acceptable variance threshold.';
    }
    return row;
  });

  const ws1 = XLSX.utils.json_to_sheet(ne);
  const cols1 = Object.keys(ne[0] || {}).length;
  styleHeader(ws1, cols1);
  // Color earning header cols green, deduction cols red, recon cols brown
  const earnStart = 6; // after ID, Employee, P2 /559, P1 /559, Variance, Var%
  const dedStart = earnStart + wtCols.earn.length;
  const reconStart = dedStart + wtCols.ded.length;
  for (let c = earnStart; c < dedStart; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    if (ws1[addr]) ws1[addr].s = { ...ws1[addr].s, fill: { fgColor: { rgb: COLORS.earningBg } } };
  }
  for (let c = dedStart; c < reconStart; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    if (ws1[addr]) ws1[addr].s = { ...ws1[addr].s, fill: { fgColor: { rgb: COLORS.deductBg } } };
  }
  for (let c = reconStart; c < reconStart + 3; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    if (ws1[addr]) ws1[addr].s = { ...ws1[addr].s, fill: { fgColor: { rgb: COLORS.reconBg } } };
  }
  // Style discrepancy rows
  styleDataCells(ws1, ne, cols1, (row) => {
    if (row.Status === 'Discrepancy') {
      return { fill: { fgColor: { rgb: COLORS.discrepancyBg } } };
    }
    return null;
  });
  XLSX.utils.book_append_sheet(wb, ws1, 'Active Net Pay');

  // ── Sheet 2: Zero Pay ──
  const zeroComment = `[Zero /559] These employees have /559 (Transfer to bank) = 0 in ${n1}. Possible reasons: leave, suspension, termination, or payroll error. Previous period /559 shown for comparison.`;
  const ze = zd.map((r) => ({
    'ID': r.id, 'Employee': r.nm,
    [`${n2} /559`]: r.p2net,
    [`${n1} /559`]: r.p1net,
    'Status': 'Zero Pay',
    'Comment': `Employee received /559 = ${fmt(r.p2net)} in ${n2} but 0 in ${n1}. Verify with HR if intentional (leave/suspension/termination).`,
  }));
  const ws2 = XLSX.utils.json_to_sheet(ze);
  styleHeader(ws2, 6, COLORS.warningBorder);
  styleDataCells(ws2, ze, 6, () => ({ fill: { fgColor: { rgb: COLORS.warningBg } } }));
  XLSX.utils.book_append_sheet(wb, ws2, 'Zero Pay');

  // ── Sheet 3: Detailed Bifurcation ──
  const detComment = `[WT Bifurcation] Each tracked wage type per employee. Amount = raw amount × multiplier. Summary rows show employee totals. Discrepancy = variance % exceeds threshold.`;
  const de = dd.map((r) => {
    let comment = '';
    if (r.isGroupHeader) {
      comment = `Employee ${r.id} (${r.nm}): Total across ${r.wtCount || '?'} tracked wage types. ` +
        `${n1}: ${fmt(r.a1)} | ${n2}: ${fmt(r.a2)} | Diff: ${fmt(r.v)}. ` +
        `${(r.discCount || 0) > 0 ? r.discCount + ' wage type(s) with variance exceeding threshold.' : 'All wage types within threshold.'}`;
    } else if (r.st === 'Discrepancy') {
      comment = `${r.compType} "${r.wt}": Changed from ${fmt(r.a2)} to ${fmt(r.a1)} (${r.vp > 0 ? '+' : ''}${r.vp.toFixed(2)}%). ` +
        `Multiplier: ${r.mult}. This variance exceeds the threshold — investigate with payroll.`;
    } else if (r.v !== 0) {
      comment = `${r.compType} "${r.wt}": Minor change from ${fmt(r.a2)} to ${fmt(r.a1)} (${r.vp > 0 ? '+' : ''}${r.vp.toFixed(2)}%). Within threshold.`;
    } else {
      comment = `${r.compType} "${r.wt}": No change between periods. Amount: ${fmt(r.a1)}.`;
    }
    return {
      'ID': r.id, 'Employee': r.nm, 'WT Code': r.wtCode || '', 'Wage Type': r.wt,
      'Component': r.compType || '',
      'Multiplier': r.mult,
      [`${n1} (Current)`]: r.a1, [`${n2} (Previous)`]: r.a2,
      'Variance': r.v, 'Variance %': r.vp.toFixed(2) + '%',
      'Status': r.st,
      'Row Type': r.isGroupHeader ? 'EMPLOYEE SUMMARY' : 'Detail',
      'Comment': comment,
    };
  });
  const ws3 = XLSX.utils.json_to_sheet(de);
  const cols3 = 13;
  styleHeader(ws3, cols3);
  styleDataCells(ws3, de, cols3, (row) => {
    if (row['Row Type'] === 'EMPLOYEE SUMMARY') {
      return { fill: { fgColor: { rgb: COLORS.summaryBg } }, font: { bold: true } };
    }
    if (row.Status === 'Discrepancy') {
      return { fill: { fgColor: { rgb: COLORS.discrepancyBg } } };
    }
    return null;
  });
  XLSX.utils.book_append_sheet(wb, ws3, 'WT Bifurcation');

  // ── Sheet 4: Removed WT ──
  const rmComment = `[Removed WTs] Tracked wage types present in ${n2} but missing in ${n1}. Impact = amount × multiplier. Positive impact from earnings removal reduces income; negative impact from deduction removal increases income.`;
  const re = rmd.map((r) => ({
    'ID': r.id, 'Employee': r.nm, 'WT Code': r.wtCode || '', 'Wage Type': r.wt,
    'Component': r.compType,
    [`${n2} Amount`]: r.p2amt, 'Multiplier': r.mult,
    'Impact on /559': r.impact,
    'Comment': `${r.compType} "${r.wt}" for Employee ${r.id} (${r.nm}): ` +
      `Was ${fmt(r.p2amt)} × ${r.mult} = ${fmt(r.impact)} in ${n2}, now absent in ${n1}. ` +
      `${r.note}. Verify with HR/Payroll if this removal is intentional.`,
  }));
  const ws4 = XLSX.utils.json_to_sheet(re);
  styleHeader(ws4, 9, COLORS.errorText);
  styleDataCells(ws4, re, 9, () => ({ fill: { fgColor: { rgb: COLORS.errorBg } } }));
  XLSX.utils.book_append_sheet(wb, ws4, 'Removed WT');

  // ── Sheet 5: Added WT ──
  const addComment = `[New WTs] Tracked wage types present in ${n1} but absent in ${n2}. Impact = amount × multiplier. New earnings increase income; new deductions reduce income.`;
  const ae = add.map((r) => ({
    'ID': r.id, 'Employee': r.nm, 'WT Code': r.wtCode || '', 'Wage Type': r.wt,
    'Component': r.compType,
    [`${n1} Amount`]: r.p1amt, 'Multiplier': r.mult,
    'Impact on /559': r.impact,
    'Comment': `${r.compType} "${r.wt}" for Employee ${r.id} (${r.nm}): ` +
      `New in ${n1} with value ${fmt(r.p1amt)} × ${r.mult} = ${fmt(r.impact)}. ` +
      `${r.note}. Verify correct setup with HR/Payroll.`,
  }));
  const ws5 = XLSX.utils.json_to_sheet(ae);
  styleHeader(ws5, 9, COLORS.successText);
  styleDataCells(ws5, ae, 9, () => ({ fill: { fgColor: { rgb: COLORS.successBg } } }));
  XLSX.utils.book_append_sheet(wb, ws5, 'New WT');

  // ── Sheet 6: Active Gross Pay (/101) ──
  if (nd101 && nd101.length) {
    // eslint-disable-next-line no-unused-vars
    const gross101Comment = `[/101 Comparison] Each row = one employee. /101 (Gross amount) is compared between ${n1} and ${n2}. Status = Discrepancy if variance % exceeds threshold.`;
    const ge = nd101.map((r) => {
      const row = {
        'ID': r.id, 'Employee': r.nm,
        [`${n2} /101`]: r.p2net,
        [`${n1} /101`]: r.p1net,
        '/101 Variance': r.v,
        'Variance %': r.vp.toFixed(2) + '%',
      };
      wtCols.earn.forEach((wt) => (row[`[E] ${wc[wt] ? wc[wt] + ' - ' : ''}${wt}`] = r.wtDiffs[wt] || 0));
      wtCols.ded.forEach((wt) => (row[`[D] ${wc[wt] ? wc[wt] + ' - ' : ''}${wt}`] = r.wtDiffs[wt] || 0));
      row[`${n1} Recon (Calc-/101)`] = r.p1GrossToNetDiff;
      row[`${n2} Recon (Calc-/101)`] = r.p2GrossToNetDiff;
      row['Var Recon Diff'] = r.varReconDiff;
      row['Status'] = r.st;
      row['Comment'] = r.st === 'Discrepancy'
        ? `Variance of ${r.vp.toFixed(2)}% exceeds threshold. Review wage type diffs.`
        : 'Within acceptable variance threshold.';
      return row;
    });
    const wsG = XLSX.utils.json_to_sheet(ge);
    const colsG = Object.keys(ge[0] || {}).length;
    styleHeader(wsG, colsG);
    const earnStartG = 6;
    const dedStartG = earnStartG + wtCols.earn.length;
    const reconStartG = dedStartG + wtCols.ded.length;
    for (let c = earnStartG; c < dedStartG; c++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c });
      if (wsG[addr]) wsG[addr].s = { ...wsG[addr].s, fill: { fgColor: { rgb: COLORS.earningBg } } };
    }
    for (let c = dedStartG; c < reconStartG; c++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c });
      if (wsG[addr]) wsG[addr].s = { ...wsG[addr].s, fill: { fgColor: { rgb: COLORS.deductBg } } };
    }
    for (let c = reconStartG; c < reconStartG + 3; c++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c });
      if (wsG[addr]) wsG[addr].s = { ...wsG[addr].s, fill: { fgColor: { rgb: COLORS.reconBg } } };
    }
    styleDataCells(wsG, ge, colsG, (row) => {
      if (row.Status === 'Discrepancy') return { fill: { fgColor: { rgb: COLORS.discrepancyBg } } };
      return null;
    });
    XLSX.utils.book_append_sheet(wb, wsG, 'Active Gross Pay 101');
  }

  // ── Sheet 7: Zero Gross Pay (/101) ──
  if (zd101 && zd101.length) {
    const ze101 = zd101.map((r) => ({
      'ID': r.id, 'Employee': r.nm,
      [`${n2} /101`]: r.p2net,
      [`${n1} /101`]: r.p1net,
      'Status': 'Zero Gross Pay',
      'Comment': `Employee had /101 = ${fmt(r.p2net)} in ${n2} but 0 in ${n1}. Verify with HR.`,
    }));
    const wsZ101 = XLSX.utils.json_to_sheet(ze101);
    styleHeader(wsZ101, 6, COLORS.warningBorder);
    styleDataCells(wsZ101, ze101, 6, () => ({ fill: { fgColor: { rgb: COLORS.warningBg } } }));
    XLSX.utils.book_append_sheet(wb, wsZ101, 'Zero Gross Pay 101');
  }

  // ── Sheet 8: Legend / Comments ──
  const legend = [
    { Section: 'Active Net Pay', Description: activeComment },
    { Section: 'Zero Pay', Description: zeroComment },
    { Section: 'WT Bifurcation', Description: detComment },
    { Section: 'Removed WT', Description: rmComment },
    { Section: 'New WT', Description: addComment },
    { Section: '', Description: '' },
    { Section: 'Color Legend', Description: '' },
    { Section: 'Blue Header', Description: 'Standard columns (ID, Name, /559, Variance, Status)' },
    { Section: 'Green Header [E]', Description: 'Earnings wage type diff columns' },
    { Section: 'Red Header [D]', Description: 'Deduction wage type diff columns' },
    { Section: 'Brown Header', Description: 'Reconciliation columns (Calc vs /559)' },
    { Section: 'Orange Row', Description: 'Discrepancy — /559 variance exceeds threshold' },
    { Section: 'Yellow Row', Description: 'Zero Pay — employee received no bank transfer' },
    { Section: 'Grey Row', Description: 'Employee summary row in WT Bifurcation' },
    { Section: 'Light Red Row', Description: 'Removed wage type — was in previous, missing in current' },
    { Section: 'Light Green Row', Description: 'New wage type — added in current, absent in previous' },
    { Section: '', Description: '' },
    { Section: 'Key Formulas', Description: '' },
    { Section: '/559 Variance', Description: '/559 Current - /559 Previous' },
    { Section: '/101 Variance', Description: '/101 Current - /101 Previous' },
    { Section: 'Variance %', Description: '(Current - Previous) / Previous × 100' },
    { Section: 'Recon (Calc - target)', Description: 'Sum of (tracked WT amounts × multipliers) minus target WT (/559 or /101). Goal: 0' },
    { Section: 'Impact', Description: 'Amount × Multiplier — the value this WT contributes to the target' },
  ];
  const ws6 = XLSX.utils.json_to_sheet(legend);
  styleHeader(ws6, 2);
  setColWidths(ws6, [25, 120]);
  XLSX.utils.book_append_sheet(wb, ws6, 'Legend & Comments');

  const fileName = `Payroll_Analysis_${n1.replace(/ /g, '')}_vs_${n2.replace(/ /g, '')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([wbOut], { type: 'application/octet-stream' }), fileName);
}
