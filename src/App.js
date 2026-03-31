import { useState, useCallback } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Box, CircularProgress, Typography, Container, Snackbar, Alert, ToggleButtonGroup, ToggleButton } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import Controls from './components/Controls';
import SummaryCards from './components/SummaryCards';
import TabContainer from './components/TabContainer';
import Footer from './components/Footer';
import { parseExcel, parseFilterFile, analyze, exportToExcel } from './utils/payrollEngine';

const theme = createTheme({
  palette: {
    primary: { main: '#1a73e8' },
    secondary: { main: '#5f6368' },
    success: { main: '#1e8e3e' },
    warning: { main: '#f9ab00' },
    error: { main: '#d93025' },
    background: { default: '#f0f4f9', paper: '#ffffff' },
  },
  typography: {
    fontFamily: '"Google Sans", "Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
    h4: { fontWeight: 600, letterSpacing: '-0.5px' },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
  },
});

export default function App() {
  const [p1Name, setP1Name] = useState('Jan 2026');
  const [p2Name, setP2Name] = useState('Dec 2025');
  const [d1, setD1] = useState(null);
  const [d2, setD2] = useState(null);
  const [filterData, setFilterData] = useState(null);
  const [wtCols, setWtCols] = useState({ earn: [], ded: [], all: [] });
  const [multipliers, setMultipliers] = useState({});
  const [threshold, setThreshold] = useState(5.0);
  const [results, setResults] = useState(null);
  const [analysisMode, setAnalysisMode] = useState('559');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const [status1, setStatus1] = useState(null);
  const [status2, setStatus2] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [multiplierStatus, setMultiplierStatus] = useState(null);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleLoad = useCallback(async (file, period) => {
    if (!file) return;
    const setStatus = period === 1 ? setStatus1 : setStatus2;
    const setData = period === 1 ? setD1 : setD2;
    setStatus({ type: 'loading', text: 'Loading...' });
    try {
      const json = await parseExcel(file);
      setData(json);
      const unique = new Set(json.map((r) => `${r.ID}_${r['Wage Type Long Text']}`)).size;
      const merged = json.length - unique;
      setStatus({
        type: 'success',
        text: `${json.length.toLocaleString()} records loaded${merged > 0 ? ` (${merged} summed)` : ''}`,
      });
      showSnackbar(`Period ${period} file loaded successfully`, 'success');
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
      showSnackbar(`Error loading file: ${err.message}`, 'error');
    }
  }, []);

  const handleLoadFilter = useCallback(async (file) => {
    if (!file) return;
    setStatusFilter({ type: 'loading', text: 'Loading...' });
    try {
      const json = await parseExcel(file);
      const result = parseFilterFile(json);
      setFilterData(result.df);
      setWtCols(result.wtCols);
      setMultipliers(result.multipliers);
      setStatusFilter({
        type: 'success',
        text: `${result.wtCols.earn.length} earnings, ${result.wtCols.ded.length} deductions, ${result.df.n.length} net pay`,
      });
      if (!result.hasMultiplierColumn) {
        setMultiplierStatus({ type: 'warning', text: '"Amount Multiplied By" column not found. All amounts used as-is (x1).' });
      } else {
        setMultiplierStatus({ type: 'success', text: 'Using "Amount Multiplied By" values from filter file.' });
      }
      showSnackbar('Wage type filter loaded', 'success');
    } catch (err) {
      setStatusFilter({ type: 'error', text: err.message });
    }
  }, []);

  const handleResetFilter = useCallback(() => {
    setFilterData(null);
    setWtCols({ earn: [], ded: [], all: [] });
    setMultipliers({});
    setStatusFilter(null);
    setMultiplierStatus(null);
    showSnackbar('Filter cleared', 'info');
  }, []);

  const handleAnalyze = useCallback(() => {
    if (!d1 || !d2) { showSnackbar('Please upload both period files first', 'warning'); return; }
    setLoading(true);
    setTimeout(() => {
      try {
        const r = analyze(d1, d2, threshold, filterData, wtCols, multipliers);
        setResults(r);
        showSnackbar(`Analysis complete: ${r.active.length} active employees, ${r.zeroPay.length} zero pay`, 'success');
      } catch (err) {
        showSnackbar('Analysis error: ' + err.message, 'error');
        console.error(err);
      }
      setLoading(false);
    }, 100);
  }, [d1, d2, threshold, filterData, wtCols, multipliers]);

  const handleExport = useCallback(() => {
    if (!results) return;
    try {
      exportToExcel(results.active, results.zeroPay, results.detailed, results.removed, results.added,
        p1Name || 'Period 1', p2Name || 'Period 2', wtCols, results.active101, results.zeroPay101);
      showSnackbar('Excel file exported successfully', 'success');
    } catch (err) {
      console.error('Export error:', err);
      showSnackbar('Export error: ' + err.message, 'error');
    }
  }, [results, p1Name, p2Name, wtCols]);

  const n1 = p1Name || 'Period 1';
  const n2 = p2Name || 'Period 2';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 3 }}>
        <Container maxWidth={false} sx={{ maxWidth: 2400 }}>
          <Header />

          <UploadSection
            p1Name={p1Name} setP1Name={setP1Name}
            p2Name={p2Name} setP2Name={setP2Name}
            onLoadP1={(f) => handleLoad(f, 1)}
            onLoadP2={(f) => handleLoad(f, 2)}
            onLoadFilter={handleLoadFilter}
            onResetFilter={handleResetFilter}
            status1={status1} status2={status2} statusFilter={statusFilter}
            hasFilter={!!filterData}
            multiplierStatus={multiplierStatus}
          />

          <Controls
            threshold={threshold} setThreshold={setThreshold}
            onAnalyze={handleAnalyze}
            onExport={handleExport}
            canAnalyze={!!d1 && !!d2}
            hasResults={!!results}
          />

          {loading && (
            <Box sx={{ textAlign: 'center', py: 10 }}>
              <CircularProgress size={48} sx={{ mb: 2 }} />
              <Typography variant="h6" color="text.secondary">Processing payroll data...</Typography>
              <Typography variant="body2" color="text.disabled">Analyzing wage type changes</Typography>
            </Box>
          )}

          {results && !loading && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <ToggleButtonGroup
                  value={analysisMode}
                  exclusive
                  onChange={(_, v) => { if (v) setAnalysisMode(v); }}
                  sx={{
                    '& .MuiToggleButton-root': {
                      fontWeight: 700, textTransform: 'none', px: 3, py: 1.2,
                      '&.Mui-selected': { bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } },
                    },
                  }}
                >
                  <ToggleButton value="559">
                    <AccountBalanceWalletIcon sx={{ mr: 1 }} fontSize="small" />
                    /559 Net Pay
                  </ToggleButton>
                  <ToggleButton value="101">
                    <AccountBalanceIcon sx={{ mr: 1 }} fontSize="small" />
                    /101 Gross Pay
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <SummaryCards
                active={analysisMode === '101' ? results.active101 : results.active}
                zeroPay={analysisMode === '101' ? results.zeroPay101 : results.zeroPay}
                removed={results.removed}
                added={results.added}
                detailed={results.detailed}
                wageTypeLabel={analysisMode === '101' ? '/101' : '/559'}
                wageTypeName={analysisMode === '101' ? 'Gross amount' : 'Transfer to bank'}
              />
              <TabContainer
                results={results}
                wtCols={wtCols}
                n1={n1}
                n2={n2}
                wageTypeLabel={analysisMode === '101' ? '/101' : '/559'}
                wageTypeName={analysisMode === '101' ? 'Gross amount' : 'Transfer to bank'}
              />
            </>
          )}
          <Footer />
        </Container>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
