import { useState } from 'react';
import {
  Box, Typography, Link, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, TextField, MenuItem, Divider,
} from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import EmailIcon from '@mui/icons-material/Email';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import { CONTACT_EMAIL, CREATOR_NAME, APP_NAME, COMPANY_NAME } from '../config';

export default function Footer() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('bug');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    const prefix = type === 'bug' ? '[Bug Report]' : '[Improvement Request]';
    const mailSubject = encodeURIComponent(`${prefix} ${subject}`);
    const mailBody = encodeURIComponent(
      `Type: ${type === 'bug' ? 'Bug Report' : 'Improvement Request'}\n` +
      `Subject: ${subject}\n\n` +
      `Description:\n${description}\n\n` +
      `---\n` +
      `Sent from: Payroll Variance Analysis Tool\n` +
      `Date: ${new Date().toLocaleString()}\n` +
      `Browser: ${navigator.userAgent}`
    );
    window.open(`mailto:${CONTACT_EMAIL}?subject=${mailSubject}&body=${mailBody}`, '_self');
    setOpen(false);
    setSubject('');
    setDescription('');
  };

  return (
    <>
      <Box sx={{
        mt: 4, py: 3, px: 4,
        position: 'relative',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 2,
        '&::before': {
          content: '""',
          position: 'absolute', top: 0, left: '5%', right: '5%', height: 1,
          background: 'linear-gradient(90deg, transparent, #E2E8F0, #C7D2FE, #E2E8F0, transparent)',
        },
      }}>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
            Created by {CREATOR_NAME}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <EmailIcon sx={{ fontSize: 14, color: '#94A3B8' }} />
            <Link href={`mailto:${CONTACT_EMAIL}`} underline="hover" variant="caption" sx={{ color: '#4F46E5' }}>
              {CONTACT_EMAIL}
            </Link>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Report a bug" arrow>
            <Button
              variant="outlined" size="small" startIcon={<BugReportIcon />}
              onClick={() => { setType('bug'); setOpen(true); }}
              sx={{
                textTransform: 'none', fontWeight: 600, borderRadius: 2,
                borderColor: '#FCA5A5', color: '#DC2626',
                '&:hover': { bgcolor: '#FEF2F2', borderColor: '#DC2626' },
              }}
            >
              Report Bug
            </Button>
          </Tooltip>
          <Tooltip title="Suggest an improvement" arrow>
            <Button
              variant="outlined" size="small" startIcon={<LightbulbIcon />}
              onClick={() => { setType('improvement'); setOpen(true); }}
              sx={{
                textTransform: 'none', fontWeight: 600, borderRadius: 2,
                borderColor: '#C7D2FE', color: '#4F46E5',
                '&:hover': { bgcolor: '#EEF2FF', borderColor: '#4F46E5' },
              }}
            >
              Suggest Improvement
            </Button>
          </Tooltip>
        </Box>

        <Typography variant="caption" sx={{ color: '#94A3B8' }}>
          {APP_NAME} &copy; {new Date().getFullYear()} {COMPANY_NAME}
        </Typography>
      </Box>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {type === 'bug' ? <BugReportIcon color="error" /> : <LightbulbIcon sx={{ color: '#4F46E5' }} />}
            <Typography variant="h6" fontWeight={700}>
              {type === 'bug' ? 'Report a Bug' : 'Suggest an Improvement'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {type === 'bug'
              ? 'Describe the bug you encountered. Include steps to reproduce if possible.'
              : 'Describe the feature or improvement you would like to see.'}
            {' '}This will open your email client to send to{' '}
            <Link href={`mailto:${CONTACT_EMAIL}`} underline="hover" sx={{ color: '#4F46E5' }}>{CONTACT_EMAIL}</Link>.
          </Typography>

          <TextField
            select fullWidth label="Type" value={type}
            onChange={(e) => setType(e.target.value)} sx={{ mb: 2 }} size="small"
          >
            <MenuItem value="bug">Bug Report</MenuItem>
            <MenuItem value="improvement">Improvement Request</MenuItem>
          </TextField>

          <TextField
            fullWidth label="Subject"
            placeholder={type === 'bug' ? 'e.g., Excel export shows wrong variance' : 'e.g., Add PDF export option'}
            value={subject} onChange={(e) => setSubject(e.target.value)}
            sx={{ mb: 2 }} size="small" required
          />

          <TextField
            fullWidth label="Description"
            placeholder={type === 'bug'
              ? 'Steps to reproduce:\n1. Upload files...\n2. Click Analyze...\n3. Expected vs actual result...'
              : 'Describe the improvement and why it would be useful...'}
            value={description} onChange={(e) => setDescription(e.target.value)}
            multiline rows={5} size="small" required
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} color="secondary">Cancel</Button>
          <Button
            variant="contained" startIcon={<SendIcon />}
            onClick={handleSubmit}
            disabled={!subject.trim() || !description.trim()}
            sx={{
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              '&:hover': { background: 'linear-gradient(135deg, #4338CA, #6D28D9)' },
            }}
          >
            Send via Email
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
