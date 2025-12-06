export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { Box } from '@mui/material';
import UserDashboard from '@/components/UserDashboard';

export default function DashboardPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#FBF5DD',
        pt: '64px', // Kompensation für fixed AppBar
      }}
    >
      <UserDashboard />
    </Box>
  );
}
