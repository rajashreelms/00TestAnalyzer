import { useState, useMemo, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Box, Paper, Chip, IconButton, Collapse, Alert,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { fmt } from '../../utils/payrollEngine';
import Toolbar from '../Toolbar';

export default function DetailedTab({ data, n1, n2 }) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [discOnly, setDiscOnly] = useState(false);
  const [expandedEmps, setExpandedEmps] = useState({});

  // Group data by employee: { id -> { summary, details[] } }
  const grouped = useMemo(() => {
    const map = {};
    data.forEach((r) => {
      if (!map[r.id]) map[r.id] = { summary: null, details: [] };
      if (r.isGroupHeader) {
        map[r.id].summary = r;
      } else {
        map[r.id].details.push(r);
      }
    });
    return map;
  }, [data]);

  // Filter + sort employee groups
  const filteredGroups = useMemo(() => {
    let entries = Object.entries(grouped);

    // Filter by discrepancy
    if (discOnly) {
      entries = entries.filter(([, g]) =>
        g.details.some((r) => r.st === 'Discrepancy')
      );
    }

    // Search across employee ID, name, and wage types
    if (search) {
      const s = search.toLowerCase();
      entries = entries.filter(([id, g]) =>
        id.toString().includes(s) ||
        (g.summary?.nm || '').toLowerCase().includes(s) ||
        g.details.some((r) => r.wt.toLowerCase().includes(s))
      );
    }

    // Sort
    if (sort) {
      switch (sort) {
        case 'id':
          entries.sort((a, b) => String(a[0]).localeCompare(String(b[0]), undefined, { numeric: true }));
          break;
        case 'name':
          entries.sort((a, b) => (a[1].summary?.nm || '').localeCompare(b[1].summary?.nm || ''));
          break;
        case 'varpct':
          entries.sort((a, b) => Math.abs(b[1].summary?.vp || 0) - Math.abs(a[1].summary?.vp || 0));
          break;
        case 'variance':
          entries.sort((a, b) => Math.abs(b[1].summary?.v || 0) - Math.abs(a[1].summary?.v || 0));
          break;
        case 'wagetype':
          // Sort by number of wage types descending
          entries.sort((a, b) => b[1].details.length - a[1].details.length);
          break;
        default: break;
      }
    }

    return entries;
  }, [grouped, search, sort, discOnly]);

  const totalRecords = filteredGroups.reduce((s, [, g]) => s + g.details.length, 0);
  const totalDisc = filteredGroups.reduce((s, [, g]) => s + g.details.filter((r) => r.st === 'Discrepancy').length, 0);
  const reset = () => { setSearch(''); setSort(''); setDiscOnly(false); setExpandedEmps({}); };

  const toggleExpand = useCallback((id) => {
    setExpandedEmps((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const expandAll = () => {
    const all = {};
    filteredGroups.forEach(([id]) => { all[id] = true; });
    setExpandedEmps(all);
  };
  const collapseAll = () => setExpandedEmps({});

  const varColor = (val) => val > 0 ? 'success.main' : val < 0 ? 'error.main' : 'text.disabled';

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
        <Typography variant="body2" component="div">
          <strong>WT Bifurcation Detail:</strong> Shows each tracked wage type per employee from the WT filter file.{' '}
          <strong>Current ({n1})</strong> and <strong>Previous ({n2})</strong> columns show the amount x multiplier.{' '}
          <strong>Variance</strong> = Current - Previous. <strong>Component</strong> indicates if it's an Earning or Deduction.{' '}
          Click an employee row to expand/collapse their individual wage type breakdown.{' '}
          Employee summary row shows the total across all their tracked wage types.{' '}
          <strong>Discrepancy</strong> = variance % exceeding the configured threshold.
        </Typography>
      </Alert>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Chip label={`${filteredGroups.length} employees`} color="primary" variant="outlined" />
        <Chip label={`${totalRecords} wage types`} color="primary" variant="outlined" />
        {discOnly && <Chip label={`${totalDisc} variance${totalDisc !== 1 ? 's' : ''}`} color="warning" />}
        <Box sx={{ flexGrow: 1 }} />
        <Chip label="Expand All" onClick={expandAll} variant="outlined" size="small" sx={{ cursor: 'pointer' }} />
        <Chip label="Collapse All" onClick={collapseAll} variant="outlined" size="small" sx={{ cursor: 'pointer' }} />
      </Box>

      <Toolbar
        searchPlaceholder="Search by ID, Name or Wage Type..."
        searchValue={search} onSearch={setSearch}
        sortOptions={[
          { value: 'id', label: 'Employee ID' },
          { value: 'name', label: 'Employee Name' },
          { value: 'wagetype', label: 'Wage Type Count' },
          { value: 'varpct', label: 'Total Variance % (High to Low)' },
          { value: 'variance', label: 'Total Variance Amount (High to Low)' },
        ]}
        sortValue={sort} onSort={setSort}
        showDiscToggle discOnly={discOnly} onToggleDisc={() => setDiscOnly(!discOnly)}
        onReset={reset}
      />

      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 650, borderRadius: 2 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...hStyle, width: 40 }} />
              <TableCell sx={hStyle}>ID</TableCell>
              <TableCell sx={hStyle}>Employee Name</TableCell>
              <TableCell sx={hStyle}>Wage Type</TableCell>
              <TableCell sx={hStyle}>Component</TableCell>
              <TableCell sx={hStyle} align="right">Multiplier</TableCell>
              <TableCell sx={hStyle} align="right">{n1} (Current)</TableCell>
              <TableCell sx={hStyle} align="right">{n2} (Previous)</TableCell>
              <TableCell sx={hStyle} align="right">Variance</TableCell>
              <TableCell sx={hStyle} align="right">Var %</TableCell>
              <TableCell sx={hStyle} align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredGroups.map(([id, group]) => {
              const s = group.summary;
              const isOpen = !!expandedEmps[id];
              const hasDisc = group.details.some((r) => r.st === 'Discrepancy');

              // Sort details within group: discrepancies first, then by wage type
              const sortedDetails = [...group.details].sort((a, b) => {
                if (a.st === 'Discrepancy' && b.st !== 'Discrepancy') return -1;
                if (a.st !== 'Discrepancy' && b.st === 'Discrepancy') return 1;
                return a.wt.localeCompare(b.wt);
              });

              // If searching for a wage type, filter detail rows too
              const visibleDetails = search
                ? sortedDetails.filter((r) => {
                    const ss = search.toLowerCase();
                    return r.id.toString().includes(ss) || r.nm.toLowerCase().includes(ss) || r.wt.toLowerCase().includes(ss);
                  })
                : sortedDetails;

              return [
                // Employee summary row (always visible)
                <TableRow
                  key={`summary-${id}`}
                  onClick={() => toggleExpand(id)}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: hasDisc ? '#fff3e0' : '#f5f5f5',
                    '&:hover': { bgcolor: hasDisc ? '#ffe0b2' : '#eeeeee' },
                    borderLeft: hasDisc ? '4px solid #ff9800' : '4px solid #1a73e8',
                  }}
                >
                  <TableCell sx={{ py: 0.5 }}>
                    <IconButton size="small">
                      {isOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={800}>{id}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>{s?.nm}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      <Chip label={`${group.details.length} wage types`} size="small" variant="outlined" color="primary" />
                      {(s?.discCount || 0) > 0 && (
                        <Chip label={`${s.discCount} variance${s.discCount > 1 ? 's' : ''}`} size="small" color="warning" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">Summary</Typography></TableCell>
                  <TableCell align="right" />
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={700}>{s ? fmt(s.a1) : '—'}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={700}>{s ? fmt(s.a2) : '—'}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={800} color={s ? varColor(s.v) : 'text.secondary'}>
                      {s ? fmt(s.v) : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={800} color={s ? varColor(s.vp) : 'text.secondary'}>
                      {s ? `${s.vp.toFixed(2)}%` : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {s && (
                      <Chip
                        label={s.st}
                        size="small"
                        color={s.st === 'Approved' ? 'success' : 'error'}
                        variant={s.st === 'Approved' ? 'outlined' : 'filled'}
                        sx={{ fontWeight: 700, fontSize: 11 }}
                      />
                    )}
                  </TableCell>
                </TableRow>,

                // Detail rows (collapsible)
                <TableRow key={`collapse-${id}`} sx={{ p: 0 }}>
                  <TableCell colSpan={11} sx={{ p: 0, borderBottom: isOpen ? '2px solid #e0e0e0' : 'none' }}>
                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                      <Table size="small">
                        <TableBody>
                          {visibleDetails.map((r, i) => (
                            <TableRow
                              key={`${r.id}-${r.wt}-${i}`}
                              sx={{
                                bgcolor: r.st === 'Discrepancy' ? '#fff8e1' : '#fafafa',
                                '&:hover': { bgcolor: r.st === 'Discrepancy' ? '#fff3e0' : '#f5f5f5' },
                              }}
                            >
                              <TableCell sx={{ width: 40 }} />
                              <TableCell sx={{ pl: 4, color: 'text.secondary', width: 100 }}>{r.id}</TableCell>
                              <TableCell sx={{ color: 'text.secondary' }}>{r.nm}</TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight={600}>{r.wt}</Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={r.compType || '—'}
                                  size="small"
                                  variant="outlined"
                                  color={r.compType === 'Earnings' ? 'success' : r.compType === 'Deduction' ? 'error' : 'default'}
                                  sx={{ fontSize: 10 }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" color="text.secondary">{r.mult}</Typography>
                              </TableCell>
                              <TableCell align="right">{fmt(r.a1)}</TableCell>
                              <TableCell align="right">{fmt(r.a2)}</TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight={700} color={varColor(r.v)}>
                                  {fmt(r.v)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight={700} color={varColor(r.vp)}>
                                  {r.vp.toFixed(2)}%
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={r.st}
                                  size="small"
                                  color={r.st === 'Approved' ? 'success' : 'error'}
                                  variant={r.st === 'Approved' ? 'outlined' : 'filled'}
                                  sx={{ fontWeight: 700, fontSize: 10 }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Collapse>
                  </TableCell>
                </TableRow>,
              ];
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

const hStyle = {
  bgcolor: '#1a73e8',
  color: 'white',
  fontWeight: 700,
  fontSize: 12,
  whiteSpace: 'nowrap',
};
