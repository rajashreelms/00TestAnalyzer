import { Grid, Paper, Typography, Box, Tooltip } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import ErrorIcon from '@mui/icons-material/Error';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

function getCards(wageTypeLabel = '/559', wageTypeName = 'Transfer to bank') {
  return [
    { key: 'total', label: 'Total Employees', icon: PeopleIcon, color: '#4F46E5', gradient: 'linear-gradient(135deg, #4F46E5, #818CF8)',
      tooltip: 'Total unique employees found across both periods (active + zero pay)' },
    { key: 'active', label: 'Active Employees', icon: PersonIcon, color: '#4F46E5', gradient: 'linear-gradient(135deg, #4F46E5, #818CF8)',
      tooltip: `Employees with non-zero ${wageTypeLabel} (${wageTypeName}) in current period` },
    { key: 'zero', label: wageTypeLabel === '/101' ? 'Zero Gross' : 'Zero Pay', icon: WarningAmberIcon, color: '#D97706', gradient: 'linear-gradient(135deg, #D97706, #FBBF24)',
      tooltip: `Employees whose ${wageTypeLabel} (${wageTypeName}) is zero in current period` },
    { key: 'removed', label: 'Removed WT', icon: RemoveCircleOutlineIcon, color: '#DC2626', gradient: 'linear-gradient(135deg, #DC2626, #F87171)',
      tooltip: 'Wage types that existed in previous period but are missing in current period' },
    { key: 'added', label: 'New WT', icon: AddCircleOutlineIcon, color: '#059669', gradient: 'linear-gradient(135deg, #059669, #34D399)',
      tooltip: 'Wage types that are new in current period but were absent in previous period' },
    { key: 'records', label: 'Records', icon: AssignmentIcon, color: '#4F46E5', gradient: 'linear-gradient(135deg, #4F46E5, #818CF8)',
      tooltip: 'Total employee records processed (active + zero pay)' },
    { key: 'disc', label: 'Discrepancies', icon: ReportProblemIcon, color: '#D97706', gradient: 'linear-gradient(135deg, #D97706, #FBBF24)',
      tooltip: `Count of ${wageTypeLabel} variances exceeding the threshold` },
    { key: 'critical', label: 'Critical (>10%)', icon: ErrorIcon, color: '#DC2626', gradient: 'linear-gradient(135deg, #DC2626, #F87171)',
      tooltip: `Employees where ${wageTypeLabel} variance exceeds 10%` },
    { key: 'avgVar', label: 'Avg Variance', icon: TrendingUpIcon, color: '#7C3AED', gradient: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
      tooltip: `Average absolute ${wageTypeLabel} variance % across all active employees` },
    { key: 'recon', label: 'Perfect Recon', icon: CheckCircleIcon, color: '#059669', gradient: 'linear-gradient(135deg, #059669, #34D399)',
      tooltip: `Employees where Sum of (WT x Multiplier) matches ${wageTypeLabel} within +/- 1 in both periods` },
  ];
}

export default function SummaryCards({ active, zeroPay, removed, added, detailed, wageTypeLabel = '/559', wageTypeName = 'Transfer to bank' }) {
  const cards = getCards(wageTypeLabel, wageTypeName);
  const totalEmp = new Set([...active.map((r) => r.id), ...zeroPay.map((r) => r.id)]).size;
  const discCount = active.filter((r) => r.st === 'Discrepancy').length;
  const critCount = active.filter((r) => Math.abs(r.vp) > 10).length;
  const avgVar = active.length ? active.reduce((s, r) => s + Math.abs(r.vp), 0) / active.length : 0;
  const perfRecon = active.filter((r) => Math.abs(r.p1GrossToNetDiff) < 1 && Math.abs(r.p2GrossToNetDiff) < 1).length;

  const values = {
    total: totalEmp,
    active: active.length,
    zero: zeroPay.length,
    removed: removed.length,
    added: added.length,
    records: active.length + zeroPay.length,
    disc: discCount,
    critical: critCount,
    avgVar: avgVar.toFixed(1) + '%',
    recon: perfRecon,
  };

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Grid item xs={6} sm={4} md={2.4} lg={1.2} key={card.key}>
            <Tooltip title={card.tooltip} arrow placement="top">
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  textAlign: 'center',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: '#E2E8F0',
                  bgcolor: 'rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(10px)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  cursor: 'help',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 12px 24px ${card.color}18`,
                    borderColor: card.color + '40',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    height: 3,
                    background: card.gradient,
                    borderRadius: '3px 3px 0 0',
                  },
                }}
              >
                <Box sx={{
                  width: 36, height: 36, mx: 'auto', mb: 1,
                  borderRadius: 2,
                  background: card.color + '10',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon sx={{ fontSize: 20, color: card.color }} />
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={700}
                  sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.6rem', display: 'block' }}
                >
                  {card.label}
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ color: card.color, mt: 0.5 }}>
                  {values[card.key]}
                </Typography>
              </Paper>
            </Tooltip>
          </Grid>
        );
      })}
    </Grid>
  );
}
