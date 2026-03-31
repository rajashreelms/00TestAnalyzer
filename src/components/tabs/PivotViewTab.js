import { useState, useMemo, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Box, Paper, Alert, Chip, TablePagination,
} from '@mui/material';
import { fmt } from '../../utils/payrollEngine';
import Toolbar from '../Toolbar';
import { DEFAULT_ROWS_PER_PAGE, ROWS_PER_PAGE_OPTIONS, TABLE_COLORS } from '../../config';

export default function PivotViewTab({ data, n1 }) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  // Build pivot: { employees[], wageTypes[], matrix: { empId: { wt: amount } } }
  const pivot = useMemo(() => {
    if (!data || !data.length) return { employees: [], wageTypes: [], matrix: {} };

    const empMap = {};    // id → { id, name }
    const wtSet = new Map(); // wt long text → wt code (ordered by first appearance)
    const matrix = {};   // id → { wt: amount }

    data.forEach((r) => {
      const id = String(r.ID).trim();
      const name = r.Name || '';
      const wt = (r['Wage Type Long Text'] || '').trim();
      const wtCode = r['Wage Type'] !== undefined && r['Wage Type'] !== null ? String(r['Wage Type']).trim() : '';
      const amt = typeof r.Amount === 'number' ? r.Amount : parseFloat(String(r.Amount || '0').replace(/\s/g, '').replace(',', '.')) || 0;

      if (!id || !wt) return;

      if (!empMap[id]) empMap[id] = { id, name };
      if (!wtSet.has(wt)) wtSet.set(wt, wtCode);

      if (!matrix[id]) matrix[id] = {};
      matrix[id][wt] = (matrix[id][wt] || 0) + amt;
    });

    const employees = Object.values(empMap);
    const wageTypes = Array.from(wtSet.entries()).map(([name, code]) => ({ name, code }));

    // Sort wage types: by code numerically if available, else alphabetically
    wageTypes.sort((a, b) => {
      if (a.code && b.code) {
        const na = parseInt(a.code, 10);
        const nb = parseInt(b.code, 10);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
      }
      return a.name.localeCompare(b.name);
    });

    return { employees, wageTypes, matrix };
  }, [data]);

  useEffect(() => { setPage(0); }, [data, search, sort]);

  const filtered = useMemo(() => {
    let result = [...pivot.employees];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((e) =>
        e.id.toString().toLowerCase().includes(s) || e.name.toLowerCase().includes(s)
      );
    }
    if (sort) {
      switch (sort) {
        case 'id': result.sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true })); break;
        case 'name': result.sort((a, b) => a.name.localeCompare(b.name)); break;
        default: break;
      }
    }
    return result;
  }, [pivot.employees, search, sort]);

  const paginatedData = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const reset = () => { setSearch(''); setSort(''); setPage(0); };

  if (!data || !data.length) {
    return (
      <Alert severity="info" sx={{ borderRadius: 3 }}>
        No data available. Upload a Period 1 file and run analysis to see the pivot view.
      </Alert>
    );
  }

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2, borderRadius: 3 }}>
        <Typography variant="body2" component="div">
          <strong>Pivot View ({n1}):</strong> Current period data in a horizontal layout.
          Rows = Employees, Columns = Wage Types (WT code &amp; name), Values = Amount.{' '}
          <strong>{filtered.length}</strong> employees &times; <strong>{pivot.wageTypes.length}</strong> wage types.
        </Typography>
      </Alert>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Chip label={`${filtered.length} employees`} color="primary" variant="outlined" />
        <Chip label={`${pivot.wageTypes.length} wage types`} color="secondary" variant="outlined" />
      </Box>

      <Toolbar
        searchPlaceholder="Search by Employee ID or Name..."
        searchValue={search} onSearch={setSearch}
        sortOptions={[
          { value: 'id', label: 'Employee ID' },
          { value: 'name', label: 'Employee Name' },
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
              {pivot.wageTypes.map((wt) => (
                <TableCell
                  key={wt.name}
                  sx={{ ...hStyle, bgcolor: TABLE_COLORS.pivot, minWidth: 90 }}
                  align="right"
                  title={`${wt.code ? '/' + wt.code + ' - ' : ''}${wt.name}`}
                >
                  {wt.code ? `/${wt.code}` : ''}{'\n'}{wt.name.length > 14 ? wt.name.substring(0, 12) + '...' : wt.name}
                </TableCell>
              ))}
              <TableCell sx={{ ...hStyle, bgcolor: TABLE_COLORS.primary }} align="right">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((emp) => {
              const empAmounts = pivot.matrix[emp.id] || {};
              const total = Object.values(empAmounts).reduce((s, v) => s + v, 0);
              return (
                <TableRow
                  key={emp.id}
                  sx={{ '&:hover': { bgcolor: 'action.hover' }, transition: 'background 0.15s ease' }}
                >
                  <TableCell><Typography variant="body2" fontWeight={700}>{emp.id}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{emp.name}</Typography></TableCell>
                  {pivot.wageTypes.map((wt) => {
                    const val = empAmounts[wt.name] || 0;
                    return (
                      <TableCell key={wt.name} align="right">
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: val !== 0 ? 600 : 400,
                            color: val > 0 ? 'success.main' : val < 0 ? 'error.main' : 'text.disabled',
                          }}
                        >
                          {val !== 0 ? fmt(val) : '—'}
                        </Typography>
                      </TableCell>
                    );
                  })}
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={800}>{fmt(total)}</Typography>
                  </TableCell>
                </TableRow>
              );
            })}
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
  bgcolor: TABLE_COLORS.primary,
  color: 'white',
  fontWeight: 700,
  fontSize: 11,
  whiteSpace: 'pre-line',
  py: 1.5,
  borderBottom: 'none',
};
