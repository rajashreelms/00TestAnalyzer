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
    { key: 'total', label: 'Total Employees', icon: PeopleIcon, color: '#1a73e8',
      tooltip: 'Total unique employees found across both periods (active + zero pay)' },
    { key: 'active', label: 'Active Employees', icon: PersonIcon, color: '#1a73e8',
      tooltip: `Employees with non-zero ${wageTypeLabel} (${wageTypeName}) in current period` },
    { key: 'zero', label: wageTypeLabel === '/101' ? 'Zero Gross' : 'Zero Pay', icon: WarningAmberIcon, color: '#e65100', bg: '#fff8e1',
      tooltip: `Employees whose ${wageTypeLabel} (${wageTypeName}) is zero in current period — may be on leave, suspended, or pending adjustment` },
    { key: 'removed', label: 'Removed WT', icon: RemoveCircleOutlineIcon, color: '#c62828', bg: '#fce8e8',
      tooltip: 'Wage types from WT filter that existed in previous period but are missing in current period for one or more employees' },
    { key: 'added', label: 'New WT', icon: AddCircleOutlineIcon, color: '#1e8e3e', bg: '#e6f4ea',
      tooltip: 'Wage types from WT filter that are new in current period but were absent in previous period for one or more employees' },
    { key: 'records', label: 'Records', icon: AssignmentIcon, color: '#1a73e8',
      tooltip: 'Total employee records processed (active + zero pay)' },
    { key: 'disc', label: 'Discrepancies', icon: ReportProblemIcon, color: '#e65100', bg: '#fff8e1',
      tooltip: `Count of ${wageTypeLabel} variances exceeding the threshold — these employees need review` },
    { key: 'critical', label: 'Critical (>10%)', icon: ErrorIcon, color: '#c62828', bg: '#fce8e8',
      tooltip: `Employees where ${wageTypeLabel} variance exceeds 10% — high priority for review` },
    { key: 'avgVar', label: 'Avg Variance', icon: TrendingUpIcon, color: '#1a73e8',
      tooltip: `Average absolute ${wageTypeLabel} variance % across all active employees` },
    { key: 'recon', label: 'Perfect Recon', icon: CheckCircleIcon, color: '#1e8e3e', bg: '#e6f4ea',
      tooltip: `Employees where Sum of (WT × Multiplier) matches ${wageTypeLabel} within ±1 in both periods — bifurcation fully explains ${wageTypeLabel === '/101' ? 'gross pay' : 'net pay'}` },
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
                  border: '1px solid',
                  borderColor: card.bg ? card.color : 'divider',
                  borderLeftWidth: 4,
                  borderLeftColor: card.color,
                  bgcolor: card.bg || 'background.paper',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'help',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
                  <Icon sx={{ fontSize: 20, color: card.color, opacity: 0.7 }} />
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={700}
                  sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}
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
