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

const CONTACT_EMAIL = 'Rajashree.dharanikumar@zalaris.com';

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
      <Box
        sx={{
          mt: 4,
          py: 3,
          px: 4,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        {/* Created by */}
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            Created by Rajashree
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <EmailIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
            <Link
              href={`mailto:${CONTACT_EMAIL}`}
              underline="hover"
              variant="caption"
              color="primary"
            >
              {CONTACT_EMAIL}
            </Link>
          </Box>
        </Box>

        {/* Report Bug / Improvement */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Report a bug or suggest an improvement" arrow>
            <Button
              variant="outlined"
              size="small"
              startIcon={<BugReportIcon />}
              onClick={() => { setType('bug'); setOpen(true); }}
              color="error"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Report Bug
            </Button>
          </Tooltip>
          <Tooltip title="Suggest a feature or improvement" arrow>
            <Button
              variant="outlined"
              size="small"
              startIcon={<LightbulbIcon />}
              onClick={() => { setType('improvement'); setOpen(true); }}
              color="primary"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Suggest Improvement
            </Button>
          </Tooltip>
        </Box>

        {/* Copyright */}
        <Typography variant="caption" color="text.disabled">
          Payroll Variance Analysis Tool &copy; {new Date().getFullYear()} Zalaris
        </Typography>
      </Box>

      {/* Report Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {type === 'bug' ? <BugReportIcon color="error" /> : <LightbulbIcon color="primary" />}
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
            <Link href={`mailto:${CONTACT_EMAIL}`} underline="hover">{CONTACT_EMAIL}</Link>.
          </Typography>

          <TextField
            select
            fullWidth
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            sx={{ mb: 2 }}
            size="small"
          >
            <MenuItem value="bug">Bug Report</MenuItem>
            <MenuItem value="improvement">Improvement Request</MenuItem>
          </TextField>

          <TextField
            fullWidth
            label="Subject"
            placeholder={type === 'bug' ? 'e.g., Excel export shows wrong variance' : 'e.g., Add PDF export option'}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            sx={{ mb: 2 }}
            size="small"
            required
          />

          <TextField
            fullWidth
            label="Description"
            placeholder={type === 'bug'
              ? 'Steps to reproduce:\n1. Upload files...\n2. Click Analyze...\n3. Expected vs actual result...'
              : 'Describe the improvement and why it would be useful...'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={5}
            size="small"
            required
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSubmit}
            disabled={!subject.trim() || !description.trim()}
          >
            Send via Email
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
