import { Paper, Typography, Box, Grid, TextField, Button, Alert, Chip, LinearProgress, IconButton, Tooltip } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
// FilterAltIcon removed - using Chip for filter label
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useRef } from 'react';

function FileUploadCard({ title, subtitle, nameValue, onNameChange, onFileSelect, status, icon, extra }) {
  const fileRef = useRef();
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
      variant="outlined"
      sx={{
        p: 2.5,
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: status?.type === 'success' ? 'success.light' : 'divider',
        bgcolor: status?.type === 'success' ? 'success.50' : 'grey.50',
        transition: 'all 0.2s',
        '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' },
      }}
    >
      {extra}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        {icon}
        {title && (
          <Typography variant="subtitle2" fontWeight={700} color="primary">
            {title}
          </Typography>
        )}
      </Box>
      {subtitle && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
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
        sx={{ justifyContent: 'center', py: 1.2 }}
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
      {status?.type === 'loading' && <LinearProgress sx={{ mt: 1.5, borderRadius: 1 }} />}
      {status?.type === 'success' && (
        <Chip
          icon={<CheckCircleOutlineIcon />}
          label={status.text}
          color="success"
          size="small"
          sx={{ mt: 1.5, width: '100%' }}
        />
      )}
      {status?.type === 'error' && (
        <Alert severity="error" sx={{ mt: 1.5, py: 0 }} variant="outlined">{status.text}</Alert>
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
      <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mb: 2, borderRadius: 2 }}>
        <Typography variant="body2" component="div">
          <strong>How it works:</strong> Upload two payroll period files and a wage type filter.
          Compares <strong>/559 (Transfer to bank)</strong> and <strong>/101 (Gross amount)</strong> between current and previous month.
          The WT filter file provides the bifurcation — wage types that explain /559 and /101.
          <strong>Reconciliation:</strong> Sum of (WT amounts &times; multipliers) should equal the target wage type.
        </Typography>
      </Alert>

      <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          Upload Payroll Files
        </Typography>
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={4}>
            <FileUploadCard
              title="Period 1 (Current - Most Recent)"
              nameValue={p1Name}
              onNameChange={setP1Name}
              onFileSelect={onLoadP1}
              status={status1}
              icon={<Chip label="P1" size="small" color="primary" />}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FileUploadCard
              title="Period 2 (Previous)"
              nameValue={p2Name}
              onNameChange={setP2Name}
              onFileSelect={onLoadP2}
              status={status2}
              icon={<Chip label="P2" size="small" color="secondary" />}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FileUploadCard
              title="Wage Type Filter (Optional)"
              subtitle="Columns: Componenet Type, Wage Type Long Text, Amount Multiplied By"
              onFileSelect={onLoadFilter}
              status={statusFilter}
              icon={<Chip label="Filter" size="small" color="info" />}
              extra={
                hasFilter && (
                  <Tooltip title="Clear filter">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={onResetFilter}
                      sx={{ position: 'absolute', top: 8, right: 8 }}
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
          sx={{ mt: 2, borderRadius: 2 }}
        >
          {multiplierStatus.text}
        </Alert>
      )}
    </Box>
  );
}
