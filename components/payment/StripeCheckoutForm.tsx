"use client";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Typography,
} from "@mui/material";
import {
  AddressElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useEffect, useState } from "react";

interface StripeCheckoutFormProps {
  clientSecret: string;
  amount: number;
  currency: string;
  courseName: string;
  onSuccess: (paymentIntent: { id: string; status: string }) => void;
  onError: (error: string) => void;
}

export default function StripeCheckoutForm({
  clientSecret,
  amount,
  currency,
  courseName,
  onSuccess,
  onError,
}: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const stripeConfigured = Boolean(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<
    "success" | "error" | "info" | null
  >(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!stripe) {
      if (!stripeConfigured) {
        setMessage(
          "Zahlungen sind deaktiviert, da Stripe nicht konfiguriert ist.",
        );
        setMessageType("error");
        setIsLoaded(true);
      }
      return;
    }

    if (!clientSecret) {
      return;
    }

    // Check if payment was already processed
    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case "succeeded":
          setMessage("Zahlung erfolgreich!");
          setMessageType("success");
          onSuccess(paymentIntent);
          break;
        case "processing":
          setMessage("Deine Zahlung wird verarbeitet.");
          setMessageType("info");
          break;
        case "requires_payment_method":
          setMessage(null);
          setMessageType(null);
          break;
        default:
          setMessage("Etwas ist schiefgelaufen.");
          setMessageType("error");
          break;
      }
    });

    setIsLoaded(true);
  }, [stripe, clientSecret, onSuccess, stripeConfigured]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);
    setMessageType(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: {
          return_url: `${window.location.origin}/booking-success`,
        },
      });

      if (error) {
        if (error.type === "card_error" || error.type === "validation_error") {
          const errorMessage =
            error.message || "Es ist ein Fehler aufgetreten.";
          setMessage(errorMessage);
          setMessageType("error");
          onError(error.message || "Zahlung fehlgeschlagen");
        } else {
          setMessage("Ein unerwarteter Fehler ist aufgetreten.");
          setMessageType("error");
          onError("Unerwarteter Fehler");
        }
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        setMessage("Zahlung erfolgreich!");
        setMessageType("success");
        onSuccess(paymentIntent);
      } else {
        setMessage("Zahlung wird verarbeitet ...");
        setMessageType("info");
      }
    } catch (_err) {
      setMessage("Ein unerwarteter Fehler ist aufgetreten.");
      setMessageType("error");
      onError("Unerwarteter Fehler");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!stripeConfigured) {
    return (
      <Paper elevation={2} sx={{ p: 3, maxWidth: 500, mx: "auto" }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Stripe-Zahlungen sind für diese Umgebung nicht konfiguriert.
          Hinterlege <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> und die
          zugehörigen Server-Schlüssel, um den Checkout zu aktivieren.
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Du kannst die Kursdetails weiterhin ansehen, aber Zahlungen sind erst
          möglich, wenn Stripe-Zugangsdaten eingetragen wurden.
        </Typography>
      </Paper>
    );
  }

  if (!stripe || !elements || !isLoaded) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Zahlungsformular wird geladen ...
        </Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, maxWidth: 500, mx: "auto" }}>
      <Typography variant="h6" gutterBottom>
        Kauf abschließen
      </Typography>

      <Typography variant="body2" color="text.secondary" gutterBottom>
        Kurs: {courseName}
      </Typography>

      <Typography variant="h6" color="primary" gutterBottom>
        {(amount / 100).toFixed(2)} {currency.toUpperCase()}
      </Typography>

      <Divider sx={{ my: 2 }} />

      <form onSubmit={handleSubmit} data-testid="stripe-payment-form">
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Zahlungsinformationen
          </Typography>
          <PaymentElement
            data-testid="stripe-payment-element"
            id="payment-element"
            options={{
              layout: "tabs",
            }}
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Rechnungsadresse
          </Typography>
          <AddressElement
            data-testid="stripe-address-element"
            options={{
              mode: "billing",
              allowedCountries: ["US", "DE", "AT", "CH"],
            }}
          />
        </Box>

        {message && (
          <Alert
            severity={
              messageType === "success"
                ? "success"
                : messageType === "info"
                  ? "info"
                  : "error"
            }
            sx={{ mb: 2 }}
            data-testid="payment-message"
          >
            {message}
          </Alert>
        )}

        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={isProcessing || !stripe || !elements}
          data-testid="stripe-submit-button"
          sx={{
            py: 1.5,
            fontSize: "1rem",
            fontWeight: 600,
          }}
        >
          {isProcessing ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Verarbeitung ...
            </>
          ) : (
            `Jetzt ${(amount / 100).toFixed(2)} ${currency.toUpperCase()} zahlen`
          )}
        </Button>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", textAlign: "center", mt: 2 }}
        >
          Sichere Zahlung über Stripe
        </Typography>
      </form>
    </Paper>
  );
}
