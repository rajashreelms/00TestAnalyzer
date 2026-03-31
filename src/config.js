// ─── Centralized Configuration ────────────────────────────────────────────
// All hardcoded values are defined here for easy maintenance.
// To customize the tool for a different payroll system, update this file.
// ──────────────────────────────────────────────────────────────────────────

// ─── 1. Critical Domain Values (Wage Type Names) ─────────────────────────
export const NET_PAY_WT = 'Transfer to bank';   // /559
export const GROSS_WT = 'Gross amount';          // /101

// ─── 2. Default Period Names ─────────────────────────────────────────────
export const DEFAULT_PERIOD_1 = 'Jan 2026';
export const DEFAULT_PERIOD_2 = 'Dec 2025';

// ─── 3. Column Name Mappings ─────────────────────────────────────────────
// Maps alternate column names from input files to the internal standard names.
// Key = column name found in file, Value = internal name used by the engine.
export const COLUMN_MAP = {
  'Employee ID': 'ID', 'employee id': 'ID', 'Emp ID': 'ID', 'EmpID': 'ID',
  'Employee Name': 'Name', 'employee name': 'Name', 'Emp Name': 'Name', 'EmpName': 'Name',
  'Component Type': 'Componenet Type', 'component type': 'Componenet Type',
  'Componenet Type': 'Componenet Type',
  'wage type': 'Wage Type', 'WT': 'Wage Type', 'Wage type': 'Wage Type',
  'wage type long text': 'Wage Type Long Text',
};

// Internal column names used by the engine
export const COL_ID = 'ID';
export const COL_NAME = 'Name';
export const COL_WT_LONG = 'Wage Type Long Text';
export const COL_WT_SHORT = 'Wage Type';
export const COL_AMOUNT = 'Amount';
export const COL_COMPONENT_TYPE = 'Componenet Type';
export const COL_MULTIPLIER = 'Amount Multiplied By';

// Component type classification values (must match input data)
export const COMP_EARNINGS = 'Earnings';
export const COMP_DEDUCTION = 'Deduction';
export const COMP_NET_PAY = 'Net Pay';

// ─── 4. Thresholds & Limits ─────────────────────────────────────────────
export const DEFAULT_VARIANCE_THRESHOLD = 5.0;       // % — user-adjustable via UI
export const CRITICAL_VARIANCE_THRESHOLD = 10;        // % — for KPI card "Critical"
export const RECON_TOLERANCE = 1;                     // currency units — perfect recon tolerance
export const MAX_FILE_SIZE = 50 * 1024 * 1024;        // 50MB
export const DEFAULT_ROWS_PER_PAGE = 100;
export const ROWS_PER_PAGE_OPTIONS = [50, 100, 250, 500];
export const WT_VISIBLE_COUNT = 5;                    // breakdown items before collapse
export const SNACKBAR_DURATION = 4000;                // ms
export const EXPORT_DELAY = 100;                      // ms — export timeout

// ─── 5. Person / Company Info ────────────────────────────────────────────
export const CREATOR_NAME = 'Rajashree';
export const COMPANY_NAME = 'Zalaris';
export const CONTACT_EMAIL = 'Rajashree.dharanikumar@zalaris.com';
export const APP_VERSION = '1.0';
export const APP_NAME = 'Payroll Variance Analysis';

// ─── 6. Locale & Formatting ─────────────────────────────────────────────
export const NUMBER_LOCALE = 'en-IN';
export const NUMBER_FORMAT_OPTIONS = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

// ─── 7. Status Strings ──────────────────────────────────────────────────
export const STATUS_DISCREPANCY = 'Discrepancy';
export const STATUS_APPROVED = 'Approved';

// ─── 8. UI Labels ───────────────────────────────────────────────────────
export const LABEL_559 = '/559';
export const LABEL_101 = '/101';
export const LABEL_559_NAME = 'Net Pay';
export const LABEL_101_NAME = 'Gross Pay';
export const LABEL_559_FULL = 'Transfer to bank';
export const LABEL_101_FULL = 'Gross amount';
export const LABEL_PERIOD_1 = 'Period 1 (Current - Most Recent)';
export const LABEL_PERIOD_2 = 'Period 2 (Previous)';
export const LABEL_FILTER = 'Wage Type Filter (Optional)';
export const LABEL_FILTER_SUBTITLE = `Columns: ${COL_COMPONENT_TYPE}, ${COL_WT_LONG}, ${COL_MULTIPLIER}`;

// ─── 9. Colors (outside MUI theme) ──────────────────────────────────────
export const TABLE_COLORS = {
  primary: '#4F46E5',       // default header
  earnings: '#059669',      // earnings column header (green)
  deduction: '#DC2626',     // deduction column header (red)
  recon: '#92400E',         // reconciliation column header (brown)
  warning: '#D97706',       // zero pay header (amber)
  pivot: '#7C3AED',         // pivot WT column header (violet)
};

export const STEP_COLORS = ['#4F46E5', '#7C3AED', '#0891B2'];

// Excel export colors
export const EXCEL_COLORS = {
  primaryBg: '4F46E5',
  primaryFg: 'FFFFFF',
  earningBg: '059669',
  deductBg: 'DC2626',
  reconBg: '92400E',
  warningBg: 'FFFBEB',
  warningBorder: 'D97706',
  errorBg: 'FEF2F2',
  errorText: 'DC2626',
  successBg: 'ECFDF5',
  successText: '059669',
  summaryBg: 'F8FAFC',
  discrepancyBg: 'FFFBEB',
};

// Row highlight colors
export const ROW_COLORS = {
  zeroPay: { bg: '#FFFBEB', hover: '#FEF3C7' },
  discrepancy: { bg: '#FFFBEB', hover: '#FEF3C7' },
  removed: { bg: '#FEF2F2', hover: '#FEE2E2' },
  added: { bg: '#ECFDF5', hover: '#D1FAE5' },
  detail: { bg: '#FAFAFA', hover: '#F1F5F9' },
  summary: { bg: '#F8FAFC', hover: '#F1F5F9' },
  summaryDisc: { bg: '#FFFBEB', hover: '#FEF3C7' },
};

// ─── 10. Excel Export Sheet Names ────────────────────────────────────────
export const SHEET_NAMES = {
  activeNetPay: 'Active Net Pay',
  zeroPay: 'Zero Pay',
  wtBifurcation: 'WT Bifurcation',
  removedWT: 'Removed WT',
  newWT: 'New WT',
  activeGross: 'Active Gross Pay 101',
  zeroGross: 'Zero Gross Pay 101',
  legend: 'Legend & Comments',
};

// ─── 11. File Format Support ─────────────────────────────────────────────
export const TEXT_EXTENSIONS = ['csv', 'txt', 'tsv'];
export const FILE_ACCEPT = '.xlsx,.xls,.csv,.txt,.tsv';
export const FILE_ACCEPT_LABEL = 'Choose File (.xlsx, .csv, .txt)';
