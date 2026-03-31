import { useState, useMemo, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Typography, Box, Paper, Alert, Tooltip, TablePagination,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { fmt } from '../../utils/payrollEngine';
import Toolbar from '../Toolbar';

const VISIBLE_COUNT = 5; // Show top 5 wage types, collapse the rest

function WTBreakdownCell({ breakdown, netPay, changes, wtLabel = '/559', wtName = 'Bank Transfer' }) {
  const [expanded, setExpanded] = useState(false);
  if (!breakdown || !breakdown.length) {
    return <Typography variant="caption" color="text.disabled">No tracked WTs</Typography>;
  }

  const visible = expanded ? breakdown : breakdown.slice(0, VISIBLE_COUNT);
  const hiddenCount = breakdown.length - VISIBLE_COUNT;
  const totalCalc = breakdown.reduce((s, w) => s + w.p1amt, 0);

  return (
    <Box sx={{ fontSize: 11, lineHeight: 1.5, maxWidth: 380 }}>
      {/* /559 Bank Transfer */}
      <Chip
        label={`${wtLabel} ${wtName}: ${fmt(netPay)}`}
        size="small"
        color="primary"
        sx={{ mb: 0.5, fontSize: 10, height: 22, fontWeight: 700 }}
      />
      <Box sx={{ fontSize: 10, color: 'text.secondary', mb: 0.5 }}>
        Calc Total: {fmt(totalCalc)} | {changes} WT{changes !== 1 ? 's' : ''} changed
      </Box>

      {/* Wage type rows */}
      {visible.map((w, i) => (
        <Box
          key={i}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 1,
            py: 0.2,
            borderBottom: '1px dotted #e0e0e0',
          }}
        >
          <Tooltip title={`${w.compType} | Current: ${fmt(w.p1amt)} | Previous: ${fmt(w.p2amt)} | Diff: ${fmt(w.diff)}`} arrow>
            <Typography
              variant="caption"
              sx={{
                color: w.compType === 'Earnings' ? 'success.main' : w.compType === 'Deduction' ? 'error.main' : 'text.primary',
                fontWeight: 500,
                maxWidth: 220,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                cursor: 'help',
              }}
            >
              {w.wtCode ? `/${w.wtCode} ` : ''}{w.name}
            </Typography>
          </Tooltip>
          <Typography variant="caption" fontWeight={700} sx={{ whiteSpace: 'nowrap' }}>
            {fmt(w.p1amt)}
          </Typography>
        </Box>
      ))}

      {/* Expand/collapse for remaining items */}
      {hiddenCount > 0 && (
        <Box
          onClick={() => setExpanded(!expanded)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            color: 'primary.main',
            mt: 0.3,
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          <Typography variant="caption" fontWeight={600}>
            {expanded ? 'Show less' : `+${hiddenCount} more...`}
          </Typography>
          {expanded ? <ExpandLessIcon sx={{ fontSize: 14 }} /> : <ExpandMoreIcon sx={{ fontSize: 14 }} />}
        </Box>
      )}
    </Box>
  );
}

export default function ActiveNetPayTab({ data, wtCols, n1, n2, wageTypeLabel = '/559', wageTypeName = 'Transfer to bank', wtCodeMap = {} }) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [discOnly, setDiscOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);

  useEffect(() => { setPage(0); }, [data, search, sort, discOnly]);

  const filtered = useMemo(() => {
    let result = [...data];
    if (discOnly) result = result.filter((r) => r.st === 'Discrepancy');
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((r) =>
        r.id.toString().includes(s) || r.nm.toLowerCase().includes(s) ||
        (r.wtBreakdown || []).some((w) => w.name.toLowerCase().includes(s))
      );
    }
    if (sort) {
      switch (sort) {
        case 'id': result.sort((a, b) => a.id - b.id); break;
        case 'name': result.sort((a, b) => a.nm.localeCompare(b.nm)); break;
        case 'varpct': result.sort((a, b) => Math.abs(b.vp) - Math.abs(a.vp)); break;
        case 'netvar': result.sort((a, b) => Math.abs(b.v) - Math.abs(a.v)); break;
        default: break;
      }
    }
    return result;
  }, [data, search, sort, discOnly]);

  const discCount = filtered.filter((r) => r.st === 'Discrepancy').length;
  const paginatedData = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const reset = () => { setSearch(''); setSort(''); setDiscOnly(false); setPage(0); };

  const varColor = (val) => val > 0 ? 'success.main' : val < 0 ? 'error.main' : 'success.main';
  const reconColor = (val) => Math.abs(val) < 1 ? 'success.main' : 'error.main';

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
        <Typography variant="body2" component="div">
          <strong>{wageTypeLabel} Comparison:</strong> Each row shows one employee's {wageTypeLabel} ({wageTypeName}) for {n1} vs {n2}.{' '}
          <strong>Earnings columns (green headers)</strong> show the period-over-period diff for each earning wage type.{' '}
          <strong>Deduction columns (red headers)</strong> show the diff for each deduction.{' '}
          <strong>Recon columns (brown headers)</strong> show whether Sum(WT x Multiplier) matches {wageTypeLabel} — a recon diff near 0 means
          the tracked wage types fully explain the {wageTypeLabel === '/101' ? 'gross amount' : 'bank transfer'}.
          Variance % = ({wageTypeLabel} current - {wageTypeLabel} previous) / {wageTypeLabel} previous x 100.
        </Typography>
      </Alert>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Chip label={`${filtered.length} employees`} color="primary" variant="outlined" />
        {discOnly && <Chip label={`${discCount} net pay variance${discCount !== 1 ? 's' : ''}`} color="warning" />}
      </Box>

      <Toolbar
        searchPlaceholder="Search by Employee ID or Name..."
        searchValue={search} onSearch={setSearch}
        sortOptions={[
          { value: 'id', label: 'Employee ID' },
          { value: 'name', label: 'Employee Name' },
          { value: 'varpct', label: 'Variance % (High to Low)' },
          { value: 'netvar', label: 'Net Variance (High to Low)' },
        ]}
        sortValue={sort} onSort={setSort}
        showDiscToggle discOnly={discOnly} onToggleDisc={() => setDiscOnly(!discOnly)}
        onReset={reset}
      />

      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 600, borderRadius: 2 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={hStyle}>ID</TableCell>
              <TableCell sx={hStyle}>Name</TableCell>
              <TableCell sx={hStyle} align="right">{n2}{'\n'}{wageTypeLabel} {wageTypeLabel === '/101' ? 'Gross' : 'Net Pay'}</TableCell>
              <TableCell sx={hStyle} align="right">{n1}{'\n'}{wageTypeLabel} {wageTypeLabel === '/101' ? 'Gross' : 'Net Pay'}</TableCell>
              <TableCell sx={hStyle} align="right">{wageTypeLabel}{'\n'}Variance</TableCell>
              <TableCell sx={hStyle} align="right">Var %</TableCell>
              {wtCols.earn.map((wt) => {
                const code = wtCodeMap[wt];
                const label = code ? `${code} : ${wt}` : wt;
                return (
                  <TableCell key={wt} sx={{ ...hStyle, bgcolor: '#059669' }} align="right" title={label}>
                    {label.length > 20 ? label.substring(0, 18) + '...' : label}
                  </TableCell>
                );
              })}
              {wtCols.ded.map((wt) => {
                const code = wtCodeMap[wt];
                const label = code ? `${code} : ${wt}` : wt;
                return (
                  <TableCell key={wt} sx={{ ...hStyle, bgcolor: '#DC2626' }} align="right" title={label}>
                    {label.length > 20 ? label.substring(0, 18) + '...' : label}
                  </TableCell>
                );
              })}
              <TableCell sx={{ ...hStyle, bgcolor: '#92400E' }} align="right" title={`Sum of (WT × Mult) minus ${wageTypeLabel}`}>{n1} Recon{'\n'}(Calc - {wageTypeLabel})</TableCell>
              <TableCell sx={{ ...hStyle, bgcolor: '#92400E' }} align="right" title={`Sum of (WT × Mult) minus ${wageTypeLabel}`}>{n2} Recon{'\n'}(Calc - {wageTypeLabel})</TableCell>
              <TableCell sx={{ ...hStyle, bgcolor: '#92400E' }} align="right" title={`Does WT diff explain ${wageTypeLabel} diff?`}>Var Recon{'\n'}Diff</TableCell>
              <TableCell sx={{ ...hStyle, minWidth: 340 }}>WT Bifurcation{'\n'}(Current Period)</TableCell>
              <TableCell sx={hStyle} align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((r) => (
              <TableRow
                key={r.id}
                sx={{ bgcolor: r.st === 'Discrepancy' ? 'warning.50' : undefined, '&:hover': { bgcolor: 'action.hover' } }}
              >
                <TableCell><Typography variant="body2" fontWeight={700}>{r.id}</Typography></TableCell>
                <TableCell><Typography variant="body2">{r.nm}</Typography></TableCell>
                <TableCell align="right">{fmt(r.p2net)}</TableCell>
                <TableCell align="right">{fmt(r.p1net)}</TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={700} color={varColor(r.v)}>{fmt(r.v)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={700} color={varColor(r.vp)}>{r.vp.toFixed(2)}%</Typography>
                </TableCell>
                {wtCols.earn.map((wt) => {
                  const diff = r.wtDiffs[wt] || 0;
                  return (
                    <TableCell key={wt} align="right">
                      <Typography variant="body2" color={varColor(diff)} fontWeight={diff !== 0 ? 700 : 400}>
                        {fmt(diff)}
                      </Typography>
                    </TableCell>
                  );
                })}
                {wtCols.ded.map((wt) => {
                  const diff = r.wtDiffs[wt] || 0;
                  return (
                    <TableCell key={wt} align="right">
                      <Typography variant="body2" color={varColor(diff)} fontWeight={diff !== 0 ? 700 : 400}>
                        {fmt(diff)}
                      </Typography>
                    </TableCell>
                  );
                })}
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={700} color={reconColor(r.p1GrossToNetDiff)}>{fmt(r.p1GrossToNetDiff)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={700} color={reconColor(r.p2GrossToNetDiff)}>{fmt(r.p2GrossToNetDiff)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={700} color={reconColor(r.varReconDiff)}>{fmt(r.varReconDiff)}</Typography>
                </TableCell>
                <TableCell>
                  <WTBreakdownCell breakdown={r.wtBreakdown} netPay={r.p1net} changes={r.cc} wtLabel={wageTypeLabel} wtName={wageTypeLabel === '/101' ? 'Gross Amount' : 'Bank Transfer'} />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={r.st}
                    size="small"
                    color={r.st === 'Approved' ? 'success' : 'error'}
                    variant={r.st === 'Approved' ? 'outlined' : 'filled'}
                    sx={{ fontWeight: 700, fontSize: 11 }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={filtered.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[50, 100, 250, 500]}
      />
    </Box>
  );
}

const hStyle = {
  bgcolor: '#4F46E5',
  color: 'white',
  fontWeight: 700,
  fontSize: 11,
  whiteSpace: 'nowrap',
  py: 1.5,
  borderBottom: 'none',
};
