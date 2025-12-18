/**
 * Debug page to check admin authentication status
 */

import { currentUser } from '@clerk/nextjs/server';
import { Alert, Box, Card, CardContent, Typography } from '@mui/material';

export default async function AdminDebugPage() {
  const user = await currentUser();

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant='h4' gutterBottom>
        Admin Debug-Informationen
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Authentifizierungsstatus
          </Typography>

          {!user ? (
            <Alert severity='error'>
              ❌ Nicht angemeldet - Bitte melde dich zuerst an
            </Alert>
          ) : (
            <>
              <Alert severity='success' sx={{ mb: 2 }}>
                ✅ Angemeldet als:{' '}
                {user.emailAddresses[0]?.emailAddress || 'Unbekannt'}
              </Alert>

              <Typography
                variant='body2'
                component='pre'
                sx={{
                  backgroundColor: '#f5f5f5',
                  p: 2,
                  borderRadius: 1,
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {JSON.stringify(
                  {
                    id: user.id,
                    email: user.emailAddresses[0]?.emailAddress,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    publicMetadata: user.publicMetadata,
                  },
                  null,
                  2
                )}
              </Typography>

              <Box sx={{ mt: 2 }}>
                {user.publicMetadata?.role === 'admin' ? (
                  <Alert severity='success'>
                    ✅ Admin-Rolle erkannt - Du solltest Zugriff auf
                    /admin/courses haben
                  </Alert>
                ) : (
                  <Alert severity='error'>
                    ❌ Keine Admin-Rolle in publicMetadata gefunden
                    <br />
                    <br />
                    <strong>So beheben:</strong>
                    <ol style={{ marginTop: 8 }}>
                      <li>
                        Gehe zu{' '}
                        <a
                          href='https://dashboard.clerk.com'
                          target='_blank'
                          rel='noopener'
                        >
                          dashboard.clerk.com
                        </a>
                      </li>
                      <li>Wähle deinen Benutzer aus</li>
                      <li>Klicke auf den "Metadata" Tab</li>
                      <li>
                        In "Public metadata" füge hinzu:{' '}
                        <code>{`{ "role": "admin" }`}</code>
                      </li>
                      <li>Speichern, dann ausloggen und wieder einloggen</li>
                    </ol>
                  </Alert>
                )}
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Navigationslinks
          </Typography>
          <Typography component='div'>
            • <a href='/admin'>Admin-Dashboard</a> (erfordert Admin-Rolle)
            <br />• <a href='/admin/courses'>Kursverwaltung</a> (erfordert
            Admin-Rolle)
            <br />• <a href='/dashboard'>Benutzer-Dashboard</a>
            <br />• <a href='/sign-in'>Anmelden</a>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
