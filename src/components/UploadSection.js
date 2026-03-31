import { Paper, Typography, Box, Grid, TextField, Button, Alert, Chip, LinearProgress, IconButton, Tooltip } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useRef } from 'react';
import { glassStyle } from '../App';

const stepColors = ['#4F46E5', '#7C3AED', '#0891B2'];

function FileUploadCard({ title, subtitle, nameValue, onNameChange, onFileSelect, status, step, extra }) {
  const fileRef = useRef();
  const color = stepColors[(step || 1) - 1];
  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      onFileSelect(null);
      return;
    }
    onFileSelect(file);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        position: 'relative',
        borderRadius: 3,
        border: '2px dashed',
        borderColor: status?.type === 'success' ? '#059669' + '60' : '#E2E8F0',
        bgcolor: status?.type === 'success' ? '#ECFDF5' : 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: color + '80',
          bgcolor: color + '08',
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 24px ${color}15`,
        },
      }}
    >
      {extra}

      {/* Step Number Badge */}
      <Box sx={{
        position: 'absolute', top: -12, left: 20,
        width: 28, height: 28, borderRadius: '50%',
        background: `linear-gradient(135deg, ${color}, ${color}CC)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 4px 12px ${color}40`,
        zIndex: 2,
      }}>
        <Typography variant="caption" sx={{ color: 'white', fontWeight: 800, fontSize: '0.7rem' }}>
          {step}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, mt: 0.5 }}>
        {title && (
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: color }}>
            {title}
          </Typography>
        )}
      </Box>

      {subtitle && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, lineHeight: 1.5 }}>
          {subtitle}
        </Typography>
      )}

      {onNameChange && (
        <TextField
          size="small"
          fullWidth
          label="Period Name"
          value={nameValue}
          onChange={(e) => onNameChange(e.target.value)}
          sx={{ mb: 1.5 }}
        />
      )}

      <Button
        variant="outlined"
        startIcon={<CloudUploadIcon />}
        fullWidth
        onClick={() => fileRef.current.click()}
        sx={{
          justifyContent: 'center', py: 1.2,
          borderStyle: 'solid',
          borderColor: color + '40',
          color: color,
          '&:hover': {
            borderColor: color,
            bgcolor: color + '08',
          },
        }}
      >
        Choose File (.xlsx, .csv, .txt)
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv,.txt,.tsv"
        hidden
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {status?.type === 'loading' && (
        <LinearProgress
          sx={{
            mt: 1.5, borderRadius: 2, height: 4,
            bgcolor: color + '15',
            '& .MuiLinearProgress-bar': {
              background: `linear-gradient(90deg, ${color}, ${color}CC)`,
            },
          }}
        />
      )}
      {status?.type === 'success' && (
        <Chip
          icon={<CheckCircleOutlineIcon />}
          label={status.text}
          size="small"
          sx={{
            mt: 1.5, width: '100%',
            bgcolor: '#ECFDF5', color: '#065F46',
            border: '1px solid #A7F3D0',
            fontWeight: 600,
            '& .MuiChip-icon': { color: '#059669' },
          }}
        />
      )}
      {status?.type === 'error' && (
        <Alert severity="error" sx={{ mt: 1.5, py: 0, borderRadius: 2 }} variant="outlined">{status.text}</Alert>
      )}
    </Paper>
  );
}

export default function UploadSection({
  p1Name, setP1Name, p2Name, setP2Name,
  onLoadP1, onLoadP2, onLoadFilter, onResetFilter,
  status1, status2, statusFilter, hasFilter, multiplierStatus,
}) {
  return (
    <Box sx={{ mb: 3 }}>
      <Alert
        severity="info"
        icon={<InfoOutlinedIcon />}
        sx={{ mb: 2.5, borderRadius: 3, border: '1px solid #C7D2FE' }}
      >
        <Typography variant="body2" component="div" sx={{ lineHeight: 1.6 }}>
          <strong>How it works:</strong> Upload two payroll period files and a wage type filter.
          Compares <strong>/559 (Transfer to bank)</strong> and <strong>/101 (Gross amount)</strong> between current and previous month.
          The WT filter file provides the bifurcation — wage types that explain /559 and /101.
          <strong> Reconciliation:</strong> Sum of (WT amounts &times; multipliers) should equal the target wage type.
        </Typography>
      </Alert>

      <Paper
        elevation={0}
        sx={{
          p: 3, pt: 4,
          ...glassStyle,
          borderRadius: 3,
          border: '1px solid #E2E8F0',
        }}
      >
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2.5, color: 'text.primary' }}>
          Upload Payroll Files
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FileUploadCard
              step={1}
              title="Period 1 (Current - Most Recent)"
              nameValue={p1Name}
              onNameChange={setP1Name}
              onFileSelect={onLoadP1}
              status={status1}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FileUploadCard
              step={2}
              title="Period 2 (Previous)"
              nameValue={p2Name}
              onNameChange={setP2Name}
              onFileSelect={onLoadP2}
              status={status2}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FileUploadCard
              step={3}
              title="Wage Type Filter (Optional)"
              subtitle="Columns: Componenet Type, Wage Type Long Text, Amount Multiplied By"
              onFileSelect={onLoadFilter}
              status={statusFilter}
              extra={
                hasFilter && (
                  <Tooltip title="Clear filter">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={onResetFilter}
                      sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )
              }
            />
          </Grid>
        </Grid>
      </Paper>

      {multiplierStatus && (
        <Alert
          severity={multiplierStatus.type === 'warning' ? 'warning' : 'success'}
          sx={{ mt: 2, borderRadius: 3 }}
        >
          {multiplierStatus.text}
        </Alert>
      )}
    </Box>
  );
}
