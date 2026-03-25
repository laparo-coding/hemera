"use client";

import { Box, Button, Container, Stack, TextField, Typography } from "@mui/material";
import { FormEvent, useState } from "react";
import { updateCourseMaterial } from "@/lib/api/materials";

interface EditClientProps {
  materialId: string;
  initialTitle: string;
  initialDescription: string;
}

export default function EditClient({
  materialId,
  initialTitle,
  initialDescription,
}: EditClientProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateCourseMaterial(materialId, {
        title: title.trim(),
        description: description.trim(),
      });
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ein Fehler ist aufgetreten"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Kursmaterial bearbeiten
        </Typography>

        {error && (
          <Box
            sx={{
              p: 2,
              mb: 2,
              bgcolor: "error.light",
              color: "error.dark",
              borderRadius: 1,
            }}
          >
            {error}
          </Box>
        )}

        {success && (
          <Box
            sx={{
              p: 2,
              mb: 2,
              bgcolor: "success.light",
              color: "success.dark",
              borderRadius: 1,
            }}
          >
            Erfolgreich gespeichert!
          </Box>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Titel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              required
              disabled={loading}
            />

            <TextField
              label="Beschreibung"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={6}
              disabled={loading}
            />

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => {
                  setTitle(initialTitle);
                  setDescription(initialDescription);
                }}
                disabled={loading}
              >
                Zurücksetzen
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
              >
                {loading ? "Speichern..." : "Speichern"}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Box>
    </Container>
  );
}
