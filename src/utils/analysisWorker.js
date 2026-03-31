// Inline Web Worker for payroll analysis — runs off the main thread
// Uses Blob + URL.createObjectURL to work with CRA (no eject needed)

const workerCode = `
const NET_PAY_WT = 'Transfer to bank';
const GROSS_WT = 'Gross amount';

function parseNum(val) {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  let s = String(val).trim();
  if (s.includes(',') && !s.includes('.')) {
    s = s.replace(/\\s/g, '').replace(',', '.');
  } else {
    s = s.replace(/\\s/g, '').replace(/,/g, '');
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function sumRecords(data) {
  const g = {};
  data.forEach((r) => {
    const id = String(r.ID).trim();
    const wt = (r['Wage Type Long Text'] || '').trim();
    const k = id + '|||' + wt;
    if (!g[k]) g[k] = { ID: id, Name: r.Name, 'Wage Type Long Text': wt, 'Wage Type': r['Wage Type'] || '', Amount: 0 };
    g[k].Amount += parseNum(r.Amount);
  });
  return Object.values(g);
}

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

function calcNetForWT(targetWT, p1, p2, all1, all2, threshold, df, wtCols, multipliers, wtCodeMap, earningsOnlyRecon) {
  const g1 = groupById(p1);
  const g2 = groupById(p2);
  const gAll1 = groupById(all1);
  const gAll2 = groupById(all2);
  const active = [];
  const zeroPay = [];
  const hasFilter = df && df.a.length > 0;
  const reconWTs = hasFilter ? (earningsOnlyRecon ? wtCols.earn : wtCols.all) : [];

  const ids = new Set([...Object.keys(gAll1), ...Object.keys(gAll2)]);

  ids.forEach((id) => {
    const allE1 = gAll1[id] || [];
    const allE2 = gAll2[id] || [];
    if (!allE1.length || !allE2.length) return;

    const e1 = g1[id] || [];
    const e2 = g2[id] || [];
    const nm = allE1.length ? allE1[0].Name : allE2[0].Name;

    const p1net = getRawAmt(allE1, targetWT);
    const p2net = getRawAmt(allE2, targetWT);

    let p1gross = 0, p2gross = 0;
    if (hasFilter) {
      reconWTs.forEach((wt) => {
        p1gross += getWTAmt(e1, wt, multipliers);
        p2gross += getWTAmt(e2, wt, multipliers);
      });
    }

    const p1ReconDiff = hasFilter ? p1gross - p1net : 0;
    const p2ReconDiff = hasFilter ? p2gross - p2net : 0;

    const v = p1net - p2net;
    const vp = p2net ? (v / p2net) * 100 : (p1net !== 0 ? 100 : 0);

    if (p1net === 0) {
      zeroPay.push({ id, nm, p2net, p1net: 0 });
      return;
    }

    const wtDiffs = {};
    if (hasFilter) {
      wtCols.all.forEach((wt) => {
        const a1 = getWTAmt(e1, wt, multipliers);
        const a2 = getWTAmt(e2, wt, multipliers);
        if (a1 !== 0 || a2 !== 0) wtDiffs[wt] = a1 - a2;
      });
    }

    const varReconDiff = hasFilter ? (p1gross - p2gross) - v : 0;

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
      const key = id + '__' + wt;
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
      detMap[id + '__SUMMARY'] = {
        id, nm, wt: '-- TOTAL (' + empWtRows.length + ' wage types) --',
        wtCode: '', mult: '', a1: empTotalA1, a2: empTotalA2, v: empTotalV, vp: empTotalVp,
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

function analyze(d1Raw, d2Raw, threshold, df, wtCols, multipliers) {
  const wtCodeMap = { ...buildWTCodeMap(d1Raw), ...buildWTCodeMap(d2Raw) };

  const all1 = sumRecords(d1Raw);
  const all2 = sumRecords(d2Raw);

  const filterWTs = df ? df.a : [];
  let p1 = filterWTs.length ? all1.filter((r) => filterWTs.includes(r['Wage Type Long Text'])) : all1;
  let p2 = filterWTs.length ? all2.filter((r) => filterWTs.includes(r['Wage Type Long Text'])) : all2;

  const net559 = calcNetForWT(NET_PAY_WT, p1, p2, all1, all2, threshold, df, wtCols, multipliers, wtCodeMap, false);
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

self.onmessage = function(e) {
  try {
    const { d1, d2, threshold, filterData, wtCols, multipliers } = e.data;
    const results = analyze(d1, d2, threshold, filterData, wtCols, multipliers);
    self.postMessage({ type: 'success', results });
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message });
  }
};
`;

let workerInstance = null;

export function runAnalysisInWorker(d1, d2, threshold, filterData, wtCols, multipliers) {
  return new Promise((resolve, reject) => {
    // Terminate any previous worker
    if (workerInstance) {
      workerInstance.terminate();
      workerInstance = null;
    }

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    workerInstance = worker;

    worker.onmessage = (e) => {
      worker.terminate();
      workerInstance = null;
      URL.revokeObjectURL(url);
      if (e.data.type === 'success') {
        resolve(e.data.results);
      } else {
        reject(new Error(e.data.message));
      }
    };

    worker.onerror = (err) => {
      worker.terminate();
      workerInstance = null;
      URL.revokeObjectURL(url);
      reject(new Error('Analysis worker failed: ' + (err.message || 'Unknown error')));
    };

    worker.postMessage({ d1, d2, threshold, filterData, wtCols, multipliers });
  });
}
