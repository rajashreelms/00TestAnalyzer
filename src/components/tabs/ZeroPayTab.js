import { useState, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Box, Paper, Alert, Chip,
} from '@mui/material';
import { fmt } from '../../utils/payrollEngine';
import Toolbar from '../Toolbar';

export default function ZeroPayTab({ data }) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');

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

  const reset = () => { setSearch(''); setSort(''); };

  return (
    <Box>
      <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
        <Typography variant="body2" component="div">
          <strong>Zero /559 Employees:</strong> These employees have /559 (Transfer to bank) = 0 in the current period.{' '}
          <strong>Possible reasons:</strong> Employee on leave, suspended, terminated, salary adjustment pending, or payroll error.{' '}
          The "Previous Net Pay" column shows their /559 from the previous period for comparison.{' '}
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
              <TableCell sx={hStyle} align="right">Previous Net Pay</TableCell>
              <TableCell sx={hStyle} align="right">Current Net Pay</TableCell>
              <TableCell sx={hStyle}>Reason / Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id} sx={{ bgcolor: '#fffde7', '&:hover': { bgcolor: '#fff8e1' } }}>
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
    </Box>
  );
}

const hStyle = {
  bgcolor: '#e65100',
  color: 'white',
  fontWeight: 700,
  fontSize: 12,
  whiteSpace: 'nowrap',
};
