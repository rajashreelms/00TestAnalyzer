import { useState, useMemo, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Box, Paper, Alert, Chip, TablePagination,
} from '@mui/material';
import { fmt } from '../../utils/payrollEngine';
import Toolbar from '../Toolbar';

export default function RemovedWTTab({ data, n1, n2 }) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);

  useEffect(() => { setPage(0); }, [data, search, sort, filter]);

  const filtered = useMemo(() => {
    let result = [...data];
    if (filter === 'earnings') result = result.filter((r) => r.compType === 'Earnings');
    else if (filter === 'deductions') result = result.filter((r) => r.compType === 'Deduction');
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((r) =>
        r.id.toString().includes(s) || r.nm.toLowerCase().includes(s) || r.wt.toLowerCase().includes(s)
      );
    }
    if (sort) {
      switch (sort) {
        case 'id': result.sort((a, b) => a.id - b.id); break;
        case 'name': result.sort((a, b) => a.nm.localeCompare(b.nm)); break;
        case 'wagetype': result.sort((a, b) => a.wt.localeCompare(b.wt)); break;
        case 'amount': result.sort((a, b) => Math.abs(b.p2amt) - Math.abs(a.p2amt)); break;
        case 'impact': result.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)); break;
        default: break;
      }
    }
    return result;
  }, [data, search, sort, filter]);

  const totalImpact = filtered.reduce((s, r) => s + Math.abs(r.impact), 0);
  const paginatedData = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const reset = () => { setSearch(''); setSort(''); setFilter('all'); setPage(0); };

  return (
    <Box>
      <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
        <Typography variant="body2" component="div">
          <strong>Removed Wage Types:</strong> These tracked wage types (from WT filter) existed in {n2} but are missing in {n1}.{' '}
          <strong>Impact on Gross</strong> = Previous Amount x Multiplier — shows the value that is no longer contributing to /559.{' '}
          If an <strong>earning</strong> is removed, it reduces income. If a <strong>deduction</strong> is removed, it increases income.{' '}
          <strong>Action:</strong> Verify with HR/Payroll whether these removals are intentional (e.g., one-time bonus ended, deduction completed).
        </Typography>
      </Alert>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Chip label={`${filtered.length} removals`} color="error" variant="outlined" />
        <Chip label={`Total Impact: ${fmt(totalImpact)}`} color="error" />
      </Box>

      <Toolbar
        searchPlaceholder="Search by ID, Name or Wage Type..."
        searchValue={search} onSearch={setSearch}
        filterOptions={[
          { value: 'all', label: 'All Components' },
          { value: 'earnings', label: 'Earnings Only' },
          { value: 'deductions', label: 'Deductions Only' },
        ]}
        filterValue={filter} onFilter={setFilter}
        sortOptions={[
          { value: 'id', label: 'Employee ID' },
          { value: 'name', label: 'Employee Name' },
          { value: 'wagetype', label: 'Wage Type' },
          { value: 'amount', label: 'Amount (High to Low)' },
          { value: 'impact', label: 'Impact (High to Low)' },
        ]}
        sortValue={sort} onSort={setSort}
        onReset={reset}
      />

      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 600, borderRadius: 2 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={hStyle}>Employee ID</TableCell>
              <TableCell sx={hStyle}>Employee Name</TableCell>
              <TableCell sx={hStyle}>Wage Type</TableCell>
              <TableCell sx={hStyle}>Component Type</TableCell>
              <TableCell sx={hStyle} align="right">Previous Amount</TableCell>
              <TableCell sx={hStyle} align="right">Multiplier</TableCell>
              <TableCell sx={hStyle} align="right">Impact on Gross</TableCell>
              <TableCell sx={hStyle}>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((r, i) => (
              <TableRow key={`${r.id}-${r.wt}-${i}`} sx={{ bgcolor: '#FEF2F2', '&:hover': { bgcolor: '#FEE2E2' }, transition: 'background 0.15s ease' }}>
                <TableCell><Typography variant="body2" fontWeight={700}>{r.id}</Typography></TableCell>
                <TableCell>{r.nm}</TableCell>
                <TableCell><Typography variant="body2" fontWeight={600}>{r.wt}</Typography></TableCell>
                <TableCell>
                  <Chip label={r.compType} size="small" variant="outlined"
                    color={r.compType === 'Earnings' ? 'success' : r.compType === 'Deduction' ? 'error' : 'default'} />
                </TableCell>
                <TableCell align="right">{fmt(r.p2amt)}</TableCell>
                <TableCell align="right">{r.mult}</TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={700}
                    color={r.impact > 0 ? 'error.main' : r.impact < 0 ? 'success.main' : 'text.secondary'}>
                    {fmt(r.impact)}
                  </Typography>
                </TableCell>
                <TableCell><Typography variant="caption" color="text.secondary">{r.note}</Typography></TableCell>
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
  bgcolor: '#DC2626',
  color: 'white',
  fontWeight: 700,
  fontSize: 12,
  whiteSpace: 'nowrap',
  borderBottom: 'none',
};
