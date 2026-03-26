import { Paper, Typography, Box } from '@mui/material';
import AnalyticsIcon from '@mui/icons-material/Analytics';

export default function Header() {
  return (
    <Paper
      elevation={0}
      sx={{
        background: 'linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)',
        color: 'white',
        p: { xs: 3, md: 4 },
        mb: 3,
        borderRadius: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <AnalyticsIcon sx={{ fontSize: 40, opacity: 0.9 }} />
        <Box>
          <Typography variant="h5" fontWeight={700} letterSpacing="-0.5px">
            Payroll Variance Analysis
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
            /559 Comparison | WT Bifurcation | Sort &amp; Search | WT Change Tracking | Reconciliation
          </Typography>
        </Box>
      </Box>
      <Box sx={{ textAlign: 'right' }}>
        <Typography variant="caption" sx={{ opacity: 0.7, display: 'block' }}>
          Created by Rajashree
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.6 }}>
          Zalaris
        </Typography>
      </Box>
    </Paper>
  );
}
