import { Paper, Typography, Box, Chip, IconButton, Tooltip } from '@mui/material';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import SearchIcon from '@mui/icons-material/Search';
import BalanceIcon from '@mui/icons-material/Balance';

const features = [
  { label: '/559 & /101', icon: <CompareArrowsIcon sx={{ fontSize: 12 }} /> },
  { label: 'WT Bifurcation', icon: <AccountTreeIcon sx={{ fontSize: 12 }} /> },
  { label: 'Change Tracking', icon: <TrackChangesIcon sx={{ fontSize: 12 }} /> },
  { label: 'Search & Sort', icon: <SearchIcon sx={{ fontSize: 12 }} /> },
  { label: 'Reconciliation', icon: <BalanceIcon sx={{ fontSize: 12 }} /> },
];

export default function Header({ onOpenGuide }) {
  return (
    <Paper
      elevation={0}
      sx={{
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #6D28D9 100%)',
        color: 'white',
        p: { xs: 3, md: 4 },
        mb: 3,
        borderRadius: 4,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -80, right: -80,
          width: 250, height: 250,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: -60, left: '40%',
          width: 200, height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
        },
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        {/* Left: Logo + Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <Box sx={{
            width: 56, height: 56,
            borderRadius: 3,
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <AnalyticsIcon sx={{ fontSize: 32 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em" sx={{ mb: 0.5 }}>
              Payroll Variance Analysis
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              {features.map((f) => (
                <Chip
                  key={f.label}
                  icon={f.icon}
                  label={f.label}
                  size="small"
                  sx={{
                    height: 24, fontSize: '0.65rem', fontWeight: 600,
                    bgcolor: 'rgba(255,255,255,0.15)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.15)',
                    '& .MuiChip-icon': { color: 'rgba(255,255,255,0.8)' },
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>

        {/* Right: Creator + Guide */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', fontWeight: 600 }}>
              Created by Rajashree
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.5, fontWeight: 500 }}>
              Zalaris
            </Typography>
          </Box>
          <Tooltip title="Open User Guide" arrow>
            <IconButton
              onClick={onOpenGuide}
              sx={{
                bgcolor: 'rgba(255,255,255,0.15)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
              }}
            >
              <MenuBookIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Paper>
  );
}
