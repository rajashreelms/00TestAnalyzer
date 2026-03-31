import { useState } from 'react';
import { Paper, Tabs, Tab, Box, Alert, Badge, Typography } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BlockIcon from '@mui/icons-material/Block';
import ListAltIcon from '@mui/icons-material/ListAlt';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ActiveNetPayTab from './tabs/ActiveNetPayTab';
import ZeroPayTab from './tabs/ZeroPayTab';
import DetailedTab from './tabs/DetailedTab';
import RemovedWTTab from './tabs/RemovedWTTab';
import AddedWTTab from './tabs/AddedWTTab';

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ p: 3 }}>{children}</Box> : null;
}

export default function TabContainer({ results, wtCols, n1, n2, wageTypeLabel = '/559', wageTypeName = 'Transfer to bank' }) {
  const [tab, setTab] = useState(0);

  const activeData = wageTypeLabel === '/101' ? results.active101 : results.active;
  const zeroData = wageTypeLabel === '/101' ? results.zeroPay101 : results.zeroPay;

  const discCount = activeData.filter((r) => r.st === 'Discrepancy').length;
  const critCount = activeData.filter((r) => Math.abs(r.vp) > 10).length;

  return (
    <Box>
      {/* Summary comment about overall analysis */}
      <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
        <Typography variant="body2" component="div">
          <strong>Analysis Summary ({n1} vs {n2}):</strong>{' '}
          Compared {wageTypeLabel} ({wageTypeName}) for <strong>{activeData.length + zeroData.length}</strong> employees.{' '}
          {discCount > 0
            ? <><strong>{discCount}</strong> employee(s) have {wageTypeLabel} variance exceeding threshold. </>
            : 'All employees within variance threshold. '
          }
          {critCount > 0 && <><strong>{critCount}</strong> are critical (&gt;10% variance). </>}
          {zeroData.length > 0 && <><strong>{zeroData.length}</strong> employee(s) have zero {wageTypeLabel} in {n1}. </>}
          {results.removed.length > 0 && <><strong>{results.removed.length}</strong> tracked wage type(s) were removed. </>}
          {results.added.length > 0 && <><strong>{results.added.length}</strong> new tracked wage type(s) were added. </>}
        </Typography>
      </Alert>

      {zeroData.length > 0 && (
        <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 2 }}>
          <strong>{zeroData.length} employee(s)</strong> have {wageTypeLabel} = 0 in {n1}.
          {wageTypeLabel === '/559'
            ? ' These employees received no bank transfer in the current period — possible leave, suspension, or pending adjustment.'
            : ' These employees have zero gross amount in the current period — verify with HR/Payroll.'}
        </Alert>
      )}
      {results.removed.length > 0 && (
        <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>
          <strong>{results.removed.length} wage type instance(s)</strong> from the WT filter were present in {n2} but missing in {n1}.
          This may reduce the accuracy of the bifurcation. Check if these are intentional payroll structure changes.
        </Alert>
      )}
      {results.added.length > 0 && (
        <Alert severity="success" sx={{ mb: 1.5, borderRadius: 2 }}>
          <strong>{results.added.length} wage type instance(s)</strong> from the WT filter are new in {n1} (absent in {n2}).
          These could be new benefits, bonuses, corrections, or structural changes.
        </Alert>
      )}

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', minHeight: 56 },
          }}
        >
          <Tab
            icon={<AccountBalanceWalletIcon fontSize="small" />}
            iconPosition="start"
            label={wageTypeLabel === '/101' ? 'Active Gross Pay (/101)' : 'Active Net Pay (/559)'}
          />
          <Tab
            icon={
              <Badge badgeContent={zeroData.length} color="warning" max={999}>
                <BlockIcon fontSize="small" />
              </Badge>
            }
            iconPosition="start"
            label={wageTypeLabel === '/101' ? 'Zero Gross Pay' : 'Zero Pay'}
            sx={{ color: zeroData.length ? 'warning.main' : undefined }}
          />
          <Tab
            icon={<ListAltIcon fontSize="small" />}
            iconPosition="start"
            label="WT Bifurcation"
          />
          <Tab
            icon={
              <Badge badgeContent={results.removed.length} color="error" max={999}>
                <RemoveCircleIcon fontSize="small" />
              </Badge>
            }
            iconPosition="start"
            label="Removed WT"
            sx={{ color: results.removed.length ? 'error.main' : undefined }}
          />
          <Tab
            icon={
              <Badge badgeContent={results.added.length} color="success" max={999}>
                <AddCircleIcon fontSize="small" />
              </Badge>
            }
            iconPosition="start"
            label="New WT"
            sx={{ color: results.added.length ? 'success.main' : undefined }}
          />
        </Tabs>

        <TabPanel value={tab} index={0}>
          <ActiveNetPayTab data={activeData} wtCols={wtCols} n1={n1} n2={n2} wageTypeLabel={wageTypeLabel} wageTypeName={wageTypeName} />
        </TabPanel>
        <TabPanel value={tab} index={1}>
          <ZeroPayTab data={zeroData} n1={n1} n2={n2} wageTypeLabel={wageTypeLabel} wageTypeName={wageTypeName} />
        </TabPanel>
        <TabPanel value={tab} index={2}>
          <DetailedTab data={results.detailed} n1={n1} n2={n2} />
        </TabPanel>
        <TabPanel value={tab} index={3}>
          <RemovedWTTab data={results.removed} n1={n1} n2={n2} />
        </TabPanel>
        <TabPanel value={tab} index={4}>
          <AddedWTTab data={results.added} n1={n1} n2={n2} />
        </TabPanel>
      </Paper>
    </Box>
  );
}
