import { Paper, Button, TextField, Box, Divider } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

export default function Controls({ threshold, setThreshold, onAnalyze, onExport, canAnalyze, hasResults }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 3,
        display: 'flex',
        gap: 1.5,
        flexWrap: 'wrap',
        alignItems: 'center',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <TextField
        size="small"
        type="number"
        label="Variance Threshold (%)"
        value={threshold}
        onChange={(e) => setThreshold(parseFloat(e.target.value) || 0)}
        inputProps={{ min: 0, max: 100, step: 0.1 }}
        sx={{ width: 180 }}
      />

      <Button
        variant="contained"
        startIcon={<PlayArrowIcon />}
        onClick={onAnalyze}
        disabled={!canAnalyze}
        size="large"
      >
        Analyze
      </Button>

      <Button
        variant="outlined"
        startIcon={<RefreshIcon />}
        onClick={onAnalyze}
        disabled={!hasResults}
      >
        Refresh
      </Button>

      <Button
        variant="outlined"
        color="success"
        startIcon={<FileDownloadIcon />}
        onClick={onExport}
        disabled={!hasResults}
      >
        Export Excel
      </Button>

      <Box sx={{ flexGrow: 1 }} />

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <Button
        variant="text"
        color="error"
        startIcon={<RestartAltIcon />}
        onClick={() => window.location.reload()}
        size="small"
      >
        Reset All
      </Button>
    </Paper>
  );
}
