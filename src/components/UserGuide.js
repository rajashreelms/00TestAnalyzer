import { useState } from 'react';
import {
  Drawer, Box, Typography, IconButton, TextField, InputAdornment,
  Accordion, AccordionSummary, AccordionDetails, Chip, Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import DescriptionIcon from '@mui/icons-material/Description';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import TableChartIcon from '@mui/icons-material/TableChart';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import BalanceIcon from '@mui/icons-material/Balance';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import BuildIcon from '@mui/icons-material/Build';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';

const SECTIONS = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: <RocketLaunchIcon fontSize="small" />,
    color: '#4F46E5',
    content: [
      { subtitle: 'Overview', text: 'The Payroll Variance Analysis tool compares payroll data between two periods (e.g., Jan 2026 vs Dec 2025). It identifies discrepancies in net pay (/559) and gross pay (/101) for each employee, breaks down which wage types caused the variance, and flags items that need review.' },
      { subtitle: 'Quick Start Steps', text: '1. Upload Period 1 (current month) payroll file\n2. Upload Period 2 (previous month) payroll file\n3. Optionally upload a Wage Type Filter file for detailed bifurcation\n4. Set the variance threshold percentage (default: 5%)\n5. Click "Analyze" to run the comparison\n6. Review results across the 5 analysis tabs\n7. Export to Excel for sharing with stakeholders' },
      { subtitle: 'Supported File Formats', text: 'Excel (.xlsx, .xls), CSV (.csv), Text (.txt, .tsv). The tool auto-detects delimiters: comma, semicolon, tab, or pipe. European number formats (e.g., "40 737,59") are automatically handled.' },
    ],
  },
  {
    id: 'file-format',
    title: 'File Format Requirements',
    icon: <DescriptionIcon fontSize="small" />,
    color: '#0891B2',
    content: [
      { subtitle: 'Required Columns in Payroll Files', text: 'ID (or Employee ID) - Unique employee identifier\nName (or Employee Name) - Employee name\nWage Type Long Text - Name of the wage component\nAmount - The monetary value\n\nColumn names are auto-normalized: "Employee ID" becomes "ID", "Employee Name" becomes "Name", etc. Unicode BOM and zero-width characters are automatically stripped.' },
      { subtitle: 'Wage Type Filter File Columns', text: 'Componenet Type - Must be "Earnings", "Deduction", or "Net Pay"\nWage Type Long Text - The exact wage type name (must match payroll files)\nAmount Multiplied By (optional) - Multiplier for the amount (default: 1)\n\nExample: An earning with multiplier 1 adds to gross, a deduction with multiplier -1 subtracts.' },
      { subtitle: 'Large File Support', text: 'The tool handles files up to 50MB. For optimal performance with 50,000+ rows, analysis runs in a background thread. Tables are paginated at 100 rows per page to prevent browser slowdown.' },
    ],
  },
  {
    id: 'analysis',
    title: 'Understanding the Analysis',
    icon: <AnalyticsIcon fontSize="small" />,
    color: '#7C3AED',
    content: [
      { subtitle: '/559 Net Pay Comparison', text: '/559 ("Transfer to bank") represents the actual net pay deposited to each employee\'s bank account. The tool compares /559 between Period 1 (current) and Period 2 (previous) for every employee, calculates the variance amount and percentage.' },
      { subtitle: '/101 Gross Pay Comparison', text: '/101 ("Gross amount") represents the total gross pay before deductions. Same comparison logic as /559 but for the gross figure. Toggle between /559 and /101 views using the buttons above the results.' },
      { subtitle: 'Variance Threshold', text: 'The threshold (default 5%) determines which employees are flagged as "Discrepancy". If an employee\'s pay change exceeds this percentage, they are marked for review. Adjust the threshold before clicking Analyze.' },
      { subtitle: 'Variance Formula', text: 'Variance = Current Period Amount - Previous Period Amount\nVariance % = (Variance / Previous Period Amount) x 100\n\nIf previous amount is 0 but current is non-zero, variance % is shown as 100%.' },
    ],
  },
  {
    id: 'results',
    title: 'Reading the Results',
    icon: <TableChartIcon fontSize="small" />,
    color: '#059669',
    content: [
      { subtitle: 'Tab 1: Active Net Pay / Gross Pay', text: 'Shows all employees with non-zero pay in the current period. Each row includes:\n- Previous and current period amounts\n- Variance amount and percentage\n- Per-wage-type diffs (green = earnings, red = deductions)\n- Reconciliation columns (brown) showing if tracked WTs explain the total\n- WT Bifurcation breakdown showing all tracked wage types\n- Status: "Approved" (within threshold) or "Discrepancy" (exceeds threshold)' },
      { subtitle: 'Tab 2: Zero Pay', text: 'Employees whose /559 or /101 is zero in the current period. These may be on leave, suspended, terminated, or have a payroll error. Shows their previous period amount for comparison.' },
      { subtitle: 'Tab 3: WT Bifurcation', text: 'Detailed wage-type-level breakdown grouped by employee. Click an employee row to expand and see each individual wage type\'s current amount, previous amount, variance, multiplier, and component type.' },
      { subtitle: 'Tab 4: Removed WT', text: 'Wage types from the filter that existed in the previous period but are missing in the current period for specific employees. Shows the financial impact of each removal.' },
      { subtitle: 'Tab 5: New WT', text: 'Wage types from the filter that are new in the current period (absent in previous). Shows the financial impact of each addition.' },
    ],
  },
  {
    id: 'filter',
    title: 'WT Filter File',
    icon: <FilterAltIcon fontSize="small" />,
    color: '#D97706',
    content: [
      { subtitle: 'Purpose', text: 'The WT filter file tells the tool which wage types to track and analyze in detail. Without it, the tool still compares /559 and /101 totals, but won\'t show per-wage-type breakdowns, reconciliation, or WT changes.' },
      { subtitle: 'Component Types', text: 'Earnings - Wage types that add to the employee\'s pay (e.g., Basic Salary, Allowances, Bonuses)\nDeduction - Wage types that subtract from pay (e.g., Tax, Insurance, Pension)\nNet Pay - The target wage type itself (e.g., Transfer to bank)' },
      { subtitle: 'Multipliers', text: 'The "Amount Multiplied By" column controls how each wage type contributes to reconciliation. Typically:\n- Earnings: multiplier = 1 (adds to total)\n- Deductions: multiplier = -1 (subtracts from total)\n- If omitted, all multipliers default to 1' },
    ],
  },
  {
    id: 'reconciliation',
    title: 'Reconciliation',
    icon: <BalanceIcon fontSize="small" />,
    color: '#92400E',
    content: [
      { subtitle: 'What is Reconciliation?', text: 'Reconciliation checks whether the sum of tracked wage types (from the filter) fully explains the target wage type (/559 or /101). Formula:\n\nRecon Diff = Sum(WT Amount x Multiplier) - Target WT Amount\n\nA recon diff near 0 means the tracked wage types completely explain the net pay or gross pay.' },
      { subtitle: 'Variance Reconciliation', text: 'Var Recon Diff checks whether the period-over-period changes in individual wage types explain the overall change in /559 or /101. Formula:\n\nVar Recon Diff = (Sum of WT Diffs) - (/559 Variance)\n\nIf this is near 0, the tracked wage type changes fully explain why the employee\'s pay changed.' },
      { subtitle: 'Interpreting Results', text: 'Recon Diff = 0: Perfect reconciliation. Tracked WTs fully explain the total.\nRecon Diff > 0: Calculated total exceeds actual. Some deductions may be untracked.\nRecon Diff < 0: Calculated total is less than actual. Some earnings may be untracked.\n\nThe "Perfect Recon" KPI card shows how many employees have recon diff within +/- 1 in both periods.' },
    ],
  },
  {
    id: 'export',
    title: 'Excel Export',
    icon: <FileDownloadIcon fontSize="small" />,
    color: '#059669',
    content: [
      { subtitle: 'Export Contents', text: 'The Excel export includes 7-8 color-coded sheets:\n1. Active Net Pay - Full /559 comparison with WT diffs\n2. Zero Pay - Zero-pay employees\n3. WT Bifurcation - Detailed per-employee wage type breakdown\n4. Removed WT - Wage types that were removed\n5. New WT - Wage types that were added\n6. Active Gross Pay 101 - Full /101 comparison\n7. Zero Gross Pay 101 - Zero gross employees\n8. Legend & Comments - Color guide and formula explanations' },
      { subtitle: 'Color Coding', text: 'Blue headers: Standard columns\nGreen headers [E]: Earning wage type diffs\nRed headers [D]: Deduction wage type diffs\nBrown headers: Reconciliation columns\nOrange rows: Discrepancy (variance exceeds threshold)\nYellow rows: Zero pay\nGrey rows: Employee summary in WT Bifurcation\nLight red: Removed wage types\nLight green: New wage types' },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: <BuildIcon fontSize="small" />,
    color: '#DC2626',
    content: [
      { subtitle: 'File Upload Errors', text: 'Ensure your file has the required columns (ID, Name, Wage Type Long Text, Amount). Column names are flexible but must be recognizable. Check that the file is not password-protected or corrupted.' },
      { subtitle: 'No Results After Analysis', text: 'Both period files must contain at least one common employee (matching ID). Verify that the "Wage Type Long Text" column contains "Transfer to bank" for /559 analysis or "Gross amount" for /101.' },
      { subtitle: 'Wrong Numbers / European Format', text: 'The tool auto-detects European number format (comma as decimal, space as thousand separator). If numbers look wrong, verify your file uses consistent formatting. Mixed formats in the same column may cause issues.' },
      { subtitle: 'Browser Slowness with Large Files', text: 'For 50,000+ rows: Analysis runs in a background thread and won\'t freeze the browser. Use pagination controls at the bottom of each table. Consider filtering by discrepancies only to reduce visible data.' },
    ],
  },
  {
    id: 'tips',
    title: 'Tips & Best Practices',
    icon: <TipsAndUpdatesIcon fontSize="small" />,
    color: '#4F46E5',
    content: [
      { subtitle: 'Search & Filter', text: 'Use the search bar in each tab to find specific employees by ID or name. Toggle "Show Discrepancies Only" to focus on items needing review. Use the sort dropdown to order by variance percentage or amount.' },
      { subtitle: 'Threshold Tuning', text: 'Start with 5% threshold for initial review. Lower to 1-2% for detailed audit. Set to 0% to flag every change. The threshold only affects the Discrepancy/Approved status, not the calculated values.' },
      { subtitle: 'Workflow Recommendation', text: '1. Start with /559 view to check net pay variances\n2. Review Zero Pay tab for missing payments\n3. Switch to /101 for gross pay comparison\n4. Check Removed/Added WT tabs for structural changes\n5. Drill into WT Bifurcation for individual employee details\n6. Export final results for stakeholder review' },
    ],
  },
];

export default function UserGuide({ open, onClose }) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState('getting-started');

  const filteredSections = search
    ? SECTIONS.filter((s) =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.content.some((c) =>
          c.subtitle.toLowerCase().includes(search.toLowerCase()) ||
          c.text.toLowerCase().includes(search.toLowerCase())
        )
      )
    : SECTIONS;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 520 },
          background: 'linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 100%)',
          borderLeft: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      {/* Header */}
      <Box sx={{
        p: 3, pb: 2,
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        color: 'white',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>User Guide</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Payroll Variance Analysis Documentation
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white', mt: -0.5 }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <TextField
          fullWidth
          size="small"
          placeholder="Search documentation..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.15)',
              color: 'white',
              '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
              '&.Mui-focused fieldset': { borderColor: 'rgba(255,255,255,0.6)' },
            },
            '& input::placeholder': { color: 'rgba(255,255,255,0.5)', opacity: 1 },
          }}
        />
      </Box>

      <Divider />

      {/* Content */}
      <Box sx={{ overflow: 'auto', flex: 1, p: 2 }}>
        {filteredSections.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body2" color="text.secondary">No matching sections found</Typography>
          </Box>
        )}

        {filteredSections.map((section) => (
          <Accordion
            key={section.id}
            expanded={expanded === section.id}
            onChange={(_, isExpanded) => setExpanded(isExpanded ? section.id : false)}
            disableGutters
            elevation={0}
            sx={{
              mb: 1,
              border: '1px solid',
              borderColor: expanded === section.id ? section.color + '40' : 'divider',
              borderRadius: '12px !important',
              overflow: 'hidden',
              bgcolor: 'background.paper',
              transition: 'all 0.2s ease',
              '&:before': { display: 'none' },
              '&:hover': { borderColor: section.color + '60' },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: section.color }} />}
              sx={{
                px: 2.5, py: 0.5,
                '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1.5 },
              }}
            >
              <Box sx={{
                width: 32, height: 32, borderRadius: 2,
                bgcolor: section.color + '15',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: section.color, flexShrink: 0,
              }}>
                {section.icon}
              </Box>
              <Typography variant="subtitle2" fontWeight={700}>{section.title}</Typography>
              <Chip
                label={section.content.length}
                size="small"
                sx={{
                  height: 20, fontSize: 10, fontWeight: 700, ml: 'auto', mr: 1,
                  bgcolor: section.color + '15', color: section.color,
                }}
              />
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
              {section.content.map((item, i) => (
                <Box key={i} sx={{ mb: i < section.content.length - 1 ? 2.5 : 0 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{ color: section.color, mb: 0.5, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  >
                    {item.subtitle}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ whiteSpace: 'pre-line', lineHeight: 1.7, fontSize: '0.8rem' }}
                  >
                    {item.text}
                  </Typography>
                </Box>
              ))}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* Footer */}
      <Box sx={{
        p: 2, borderTop: '1px solid', borderColor: 'divider',
        textAlign: 'center', bgcolor: 'background.paper',
      }}>
        <Typography variant="caption" color="text.disabled">
          Payroll Variance Analysis v1.0 | Created by Rajashree, Zalaris
        </Typography>
      </Box>
    </Drawer>
  );
}
