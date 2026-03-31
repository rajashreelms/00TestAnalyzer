import { useState, useCallback } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Box, CircularProgress, Typography, Container, Snackbar, Alert, ToggleButtonGroup, ToggleButton, Fab, Tooltip } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import Controls from './components/Controls';
import SummaryCards from './components/SummaryCards';
import TabContainer from './components/TabContainer';
import Footer from './components/Footer';
import UserGuide from './components/UserGuide';
import { parseExcel, parseFilterFile, exportToExcel } from './utils/payrollEngine';
import { runAnalysisInWorker } from './utils/analysisWorker';

/* ─── Figma-Style Design Tokens ──────────────────────────────────────────── */
const theme = createTheme({
  palette: {
    primary: { main: '#4F46E5', light: '#818CF8', dark: '#3730A3' },
    secondary: { main: '#64748B', light: '#94A3B8', dark: '#475569' },
    success: { main: '#059669', light: '#34D399', dark: '#047857' },
    warning: { main: '#D97706', light: '#FBBF24', dark: '#B45309' },
    error: { main: '#DC2626', light: '#F87171', dark: '#B91C1C' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
    text: { primary: '#1E293B', secondary: '#64748B', disabled: '#94A3B8' },
    divider: '#E2E8F0',
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", "Segoe UI", "Roboto", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 },
    h5: { fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.3 },
    h6: { fontWeight: 600, letterSpacing: '-0.01em' },
    subtitle1: { fontWeight: 600, letterSpacing: '-0.005em' },
    subtitle2: { fontWeight: 600, fontSize: '0.8125rem' },
    body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
    caption: { fontSize: '0.6875rem', letterSpacing: '0.02em' },
  },
  shape: { borderRadius: 12 },
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0,0,0,0.05)',
    '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
    '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
    '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
    '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
    ...Array(19).fill('0 25px 50px -12px rgba(0,0,0,0.25)'),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: '#CBD5E1 transparent',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-thumb': { borderRadius: 3, background: '#CBD5E1' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none', borderRadius: 16 },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        contained: {
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
          '&:hover': { boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 8 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12 },
        standardInfo: { backgroundColor: '#EEF2FF', color: '#3730A3', '& .MuiAlert-icon': { color: '#4F46E5' } },
        standardWarning: { backgroundColor: '#FFFBEB', color: '#92400E', '& .MuiAlert-icon': { color: '#D97706' } },
        standardError: { backgroundColor: '#FEF2F2', color: '#991B1B', '& .MuiAlert-icon': { color: '#DC2626' } },
        standardSuccess: { backgroundColor: '#ECFDF5', color: '#065F46', '& .MuiAlert-icon': { color: '#059669' } },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: '#F1F5F9' },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: { borderRadius: '10px !important', borderColor: '#E2E8F0' },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: { '& .MuiOutlinedInput-root': { borderRadius: 10 } },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, minHeight: 52 },
      },
    },
  },
});

/* ─── Glass effect helper ──────────────────────────────────────────────── */
export const glassStyle = {
  background: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
};

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
  const [exportLoading, setExportLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [guideOpen, setGuideOpen] = useState(false);

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
    runAnalysisInWorker(d1, d2, threshold, filterData, wtCols, multipliers)
      .then((r) => {
        setResults(r);
        showSnackbar(`Analysis complete: ${r.active.length} active employees, ${r.zeroPay.length} zero pay`, 'success');
      })
      .catch((err) => {
        showSnackbar('Analysis error: ' + err.message, 'error');
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [d1, d2, threshold, filterData, wtCols, multipliers]);

  const handleExport = useCallback(() => {
    if (!results) return;
    setExportLoading(true);
    setTimeout(() => {
      try {
        exportToExcel(results.active, results.zeroPay, results.detailed, results.removed, results.added,
          p1Name || 'Period 1', p2Name || 'Period 2', wtCols, results.active101, results.zeroPay101);
        showSnackbar('Excel file exported successfully', 'success');
      } catch (err) {
        console.error('Export error:', err);
        showSnackbar('Export error: ' + err.message, 'error');
      }
      setExportLoading(false);
    }, 100);
  }, [results, p1Name, p2Name, wtCols]);

  const n1 = p1Name || 'Period 1';
  const n2 = p2Name || 'Period 2';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{
        bgcolor: 'background.default',
        minHeight: '100vh',
        py: { xs: 2, md: 4 },
        background: 'linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 50%, #F8FAFC 100%)',
      }}>
        <Container maxWidth={false} sx={{ maxWidth: 2400, px: { xs: 2, md: 4 } }}>
          <Header onOpenGuide={() => setGuideOpen(true)} />

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
            exportLoading={exportLoading}
          />

          {loading && (
            <Box sx={{
              textAlign: 'center', py: 10,
              ...glassStyle,
              borderRadius: 4, mx: 'auto', maxWidth: 480, my: 4,
            }}>
              <Box sx={{
                width: 64, height: 64, mx: 'auto', mb: 3,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CircularProgress size={32} sx={{ color: 'white' }} />
              </Box>
              <Typography variant="h6" sx={{ color: 'text.primary', mb: 0.5 }}>Processing payroll data...</Typography>
              <Typography variant="body2" color="text.secondary">Analyzing wage type changes across periods</Typography>
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
                    ...glassStyle,
                    borderRadius: '14px',
                    p: 0.5,
                    '& .MuiToggleButton-root': {
                      fontWeight: 700, textTransform: 'none', px: 3.5, py: 1,
                      border: 'none', borderRadius: '10px !important',
                      color: 'text.secondary',
                      transition: 'all 0.2s ease',
                      '&.Mui-selected': {
                        background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
                        '&:hover': { background: 'linear-gradient(135deg, #4338CA, #6D28D9)' },
                      },
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

      {/* Floating Help Button */}
      <Tooltip title="User Guide" arrow placement="left">
        <Fab
          size="medium"
          onClick={() => setGuideOpen(true)}
          sx={{
            position: 'fixed', bottom: 24, right: 24,
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            color: 'white',
            boxShadow: '0 8px 24px rgba(79,70,229,0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4338CA, #6D28D9)',
              transform: 'scale(1.05)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <HelpOutlineIcon />
        </Fab>
      </Tooltip>

      {/* User Guide Drawer */}
      <UserGuide open={guideOpen} onClose={() => setGuideOpen(false)} />

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
          sx={{ width: '100%', borderRadius: 3 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
