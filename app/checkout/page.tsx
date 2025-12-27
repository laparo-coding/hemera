'use client';

import { Box, CircularProgress } from '@mui/material';
import dynamic from 'next/dynamic';

const CheckoutPageClient = dynamic(
  () => import('../../components/checkout/CheckoutPageClient'),
  {
    ssr: false,
    loading: () => (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='50vh'
      >
        <CircularProgress />
      </Box>
    ),
  }
);

export default function CheckoutPage() {
  return <CheckoutPageClient />;
}
