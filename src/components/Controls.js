import { Paper, Button, TextField, Box, Divider, CircularProgress } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { glassStyle } from '../App';

export default function Controls({ threshold, setThreshold, onAnalyze, onExport, canAnalyze, hasResults, exportLoading }) {
  return (
    <Paper
      elevation={0}
      sx={{
        ...glassStyle,
        p: 2,
        mb: 3,
        display: 'flex',
        gap: 1.5,
        flexWrap: 'wrap',
        alignItems: 'center',
        borderRadius: 3,
        position: 'sticky',
        top: 8,
        zIndex: 10,
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      }}
    >
      <TextField
        size="small"
        type="number"
        label="Variance Threshold (%)"
        value={threshold}
        onChange={(e) => setThreshold(parseFloat(e.target.value) || 0)}
        inputProps={{ min: 0, max: 100, step: 0.1 }}
        sx={{ width: 190 }}
      />

      <Button
        variant="contained"
        startIcon={<PlayArrowIcon />}
        onClick={onAnalyze}
        disabled={!canAnalyze}
        size="large"
        sx={{
          background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
          px: 3,
          '&:hover': {
            background: 'linear-gradient(135deg, #4338CA, #6D28D9)',
            boxShadow: '0 4px 16px rgba(79,70,229,0.35)',
          },
          '&.Mui-disabled': {
            background: '#E2E8F0',
          },
        }}
      >
        Analyze
      </Button>

      <Button
        variant="outlined"
        startIcon={<RefreshIcon />}
        onClick={onAnalyze}
        disabled={!hasResults}
        sx={{ borderColor: '#E2E8F0', color: 'text.secondary', '&:hover': { borderColor: '#4F46E5', color: '#4F46E5' } }}
      >
        Refresh
      </Button>

      <Button
        variant="outlined"
        color="success"
        startIcon={exportLoading ? <CircularProgress size={18} color="inherit" /> : <FileDownloadIcon />}
        onClick={onExport}
        disabled={!hasResults || exportLoading}
        sx={{
          borderColor: '#A7F3D0',
          '&:hover': { borderColor: '#059669', bgcolor: '#ECFDF5' },
        }}
      >
        {exportLoading ? 'Exporting...' : 'Export Excel'}
      </Button>

      <Box sx={{ flexGrow: 1 }} />

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: '#E2E8F0' }} />

      <Button
        variant="text"
        color="error"
        startIcon={<RestartAltIcon />}
        onClick={() => window.location.reload()}
        size="small"
        sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
      >
        Reset All
      </Button>
    </Paper>
  );
}
