"use client";

import { useSignUp } from "@clerk/nextjs";
import {
  Alert,
  Box,
  Button,
  Container,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";

export default function CustomSignUpClient() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [code, setCode] = useState("");

  const redirectTo = useMemo(
    () => params?.get("redirect_url") || "/dashboard",
    [params],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isLoaded || !signUp) return;
    setSubmitting(true);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setIsVerifying(true);
    } catch (err: unknown) {
      const error = err as { errors?: Array<{ message?: string }> };
      const message =
        error?.errors?.[0]?.message || "Sign-up failed. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onVerify(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isLoaded || !signUp) return;
    setSubmitting(true);
    try {
      const complete = await signUp.attemptEmailAddressVerification({ code });
      if (complete.status === "complete") {
        await setActive?.({ session: complete.createdSessionId });
        router.push(redirectTo);
      } else {
        setError(
          "Verification not complete. Please check the code and try again.",
        );
      }
    } catch (err: unknown) {
      const error = err as { errors?: Array<{ message?: string }> };
      const message =
        error?.errors?.[0]?.message || "Verification failed. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container maxWidth="sm">
      <Box
        component="form"
        onSubmit={isVerifying ? onVerify : onSubmit}
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 2,
          py: 4,
        }}
      >
        <div id="clerk-captcha"></div>
        <Typography component="h1" variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
          {isVerifying ? "E-Mail bestätigen" : "Registrieren"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {isVerifying
            ? "Wir haben dir einen Bestätigungscode per E-Mail gesendet."
            : "Erstelle ein Konto mit E-Mail und Passwort."}
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {error}
          </Alert>
        )}
        {!isVerifying ? (
          <>
            <TextField
              type="email"
              label="E-Mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={!isLoaded || submitting}
            />
            <TextField
              type="password"
              label="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              disabled={!isLoaded || submitting}
            />
          </>
        ) : (
          <TextField
            type="text"
            label="Bestätigungscode"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            inputProps={{
              inputMode: "numeric",
              pattern: "[0-9]*",
              maxLength: 6,
            }}
            disabled={!isLoaded || submitting}
          />
        )}
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={!isLoaded || submitting}
          sx={{ mt: 1 }}
        >
          {isVerifying
            ? submitting
              ? "Wird bestätigt…"
              : "Bestätigen"
            : submitting
              ? "Wird erstellt…"
              : "Konto erstellen"}
        </Button>
      </Box>
    </Container>
  );
}
