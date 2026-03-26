import { Box, TextField, FormControl, InputLabel, Select, MenuItem, Button, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckIcon from '@mui/icons-material/Check';

export default function Toolbar({
  searchPlaceholder, searchValue, onSearch,
  sortOptions, sortValue, onSort,
  filterOptions, filterValue, onFilter,
  showDiscToggle, discOnly, onToggleDisc,
  onReset,
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        flexWrap: 'wrap',
        alignItems: 'center',
        mb: 2,
        p: 2,
        bgcolor: 'grey.50',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <TextField
        size="small"
        placeholder={searchPlaceholder}
        value={searchValue}
        onChange={(e) => onSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>
          ),
        }}
        sx={{ minWidth: 280, flexGrow: 1, maxWidth: 400 }}
      />

      {filterOptions && (
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Filter By</InputLabel>
          <Select
            value={filterValue}
            label="Filter By"
            onChange={(e) => onFilter(e.target.value)}
            startAdornment={<FilterListIcon fontSize="small" sx={{ mr: 0.5, color: 'action.active' }} />}
          >
            {filterOptions.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {sortOptions && (
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Sort By</InputLabel>
          <Select value={sortValue} label="Sort By" onChange={(e) => onSort(e.target.value)}>
            <MenuItem value="">-- None --</MenuItem>
            {sortOptions.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {showDiscToggle && (
        <Button
          variant={discOnly ? 'contained' : 'outlined'}
          color={discOnly ? 'success' : 'warning'}
          size="small"
          startIcon={discOnly ? <CheckIcon /> : <WarningAmberIcon />}
          onClick={onToggleDisc}
          sx={{ whiteSpace: 'nowrap' }}
        >
          {discOnly ? 'Showing Discrepancies' : 'Show Discrepancies Only'}
        </Button>
      )}

      <Button
        variant="text"
        color="secondary"
        size="small"
        startIcon={<RestartAltIcon />}
        onClick={onReset}
      >
        Reset
      </Button>
    </Box>
  );
}
