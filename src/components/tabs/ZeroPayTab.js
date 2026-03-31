import { useState, useMemo, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Box, Paper, Alert, Chip, TablePagination,
} from '@mui/material';
import { fmt } from '../../utils/payrollEngine';
import Toolbar from '../Toolbar';
import { DEFAULT_ROWS_PER_PAGE, ROWS_PER_PAGE_OPTIONS, TABLE_COLORS, ROW_COLORS } from '../../config';

export default function ZeroPayTab({ data, n1, n2, wageTypeLabel = '/559', wageTypeName = 'Transfer to bank' }) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  useEffect(() => { setPage(0); }, [data, search, sort]);

  const filtered = useMemo(() => {
    let result = [...data];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((r) => r.id.toString().includes(s) || r.nm.toLowerCase().includes(s));
    }
    if (sort) {
      switch (sort) {
        case 'id': result.sort((a, b) => a.id - b.id); break;
        case 'name': result.sort((a, b) => a.nm.localeCompare(b.nm)); break;
        case 'prevnet': result.sort((a, b) => b.p2net - a.p2net); break;
        default: break;
      }
    }
    return result;
  }, [data, search, sort]);

  const paginatedData = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const reset = () => { setSearch(''); setSort(''); setPage(0); };

  return (
    <Box>
      <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
        <Typography variant="body2" component="div">
          <strong>Zero {wageTypeLabel} Employees:</strong> These employees have {wageTypeLabel} ({wageTypeName}) = 0 in the current period.{' '}
          <strong>Possible reasons:</strong> Employee on leave, suspended, terminated, salary adjustment pending, or payroll error.{' '}
          The "Previous {wageTypeLabel === '/101' ? 'Gross Pay' : 'Net Pay'}" column shows their {wageTypeLabel} from the previous period for comparison.{' '}
          <strong>Action required:</strong> Verify each case with HR/Payroll to confirm the zero payment is intentional.
        </Typography>
      </Alert>

      <Chip label={`${filtered.length} employees`} color="warning" variant="outlined" sx={{ mb: 2 }} />

      <Toolbar
        searchPlaceholder="Search by Employee ID or Name..."
        searchValue={search} onSearch={setSearch}
        sortOptions={[
          { value: 'id', label: 'Employee ID' },
          { value: 'name', label: 'Employee Name' },
          { value: 'prevnet', label: 'Previous Net (High to Low)' },
        ]}
        sortValue={sort} onSort={setSort}
        onReset={reset}
      />

      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 600, borderRadius: 2 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={hStyle}>ID</TableCell>
              <TableCell sx={hStyle}>Employee Name</TableCell>
              <TableCell sx={hStyle} align="right">Previous {wageTypeLabel === '/101' ? 'Gross Pay' : 'Net Pay'}</TableCell>
              <TableCell sx={hStyle} align="right">Current {wageTypeLabel === '/101' ? 'Gross Pay' : 'Net Pay'}</TableCell>
              <TableCell sx={hStyle}>Reason / Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((r) => (
              <TableRow key={r.id} sx={{ bgcolor: ROW_COLORS.zeroPay.bg, '&:hover': { bgcolor: ROW_COLORS.zeroPay.hover }, transition: 'background 0.15s ease' }}>
                <TableCell><Typography variant="body2" fontWeight={700}>{r.id}</Typography></TableCell>
                <TableCell>{r.nm}</TableCell>
                <TableCell align="right">{fmt(r.p2net)}</TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={700} color="error">0.00</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    On Leave / Suspended / Adjustment Pending
                  </Typography>
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
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
      />
    </Box>
  );
}

const hStyle = {
  bgcolor: TABLE_COLORS.warning,
  color: 'white',
  fontWeight: 700,
  fontSize: 12,
  whiteSpace: 'nowrap',
  borderBottom: 'none',
};
