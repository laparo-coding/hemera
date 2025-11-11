export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { Box, CircularProgress } from "@mui/material";
import { Suspense } from "react";
import CheckoutSuccessClient from "@/components/checkout/CheckoutSuccessClient";

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="50vh"
        >
          <CircularProgress />
        </Box>
      }
    >
      <CheckoutSuccessClient />
    </Suspense>
  );
}
