# Linear MCP Server – Installation & Nutzung

Kurzanleitung, um den Linear Model Context Protocol (MCP) Server lokal zu installieren und in
gängigen Clients (Cursor, Claude Desktop/VS Code) zu verwenden.

## Voraussetzungen

- Node.js ≥ 18 (Repo verwendet 22.x; lokal sollte ≥18 ausreichen)
- Linear Personal API Key

### Linear API Key erstellen

1. In Linear anmelden: <https://linear.app>
2. Avatar (oben links) → Settings
3. Security & access → Personal API Keys → „New API Key“
4. Key benennen (z. B. „MCP Linear Integration“) und sicher kopieren.

## Installation

Global installieren (CLI `mcp-linear`):

```bash
npm i -g @tacticlaunch/mcp-linear
```

Überprüfen:

```bash
mcp-linear --version
```

## Starten

- Entweder als CLI-Argument:

```bash
mcp-linear --token YOUR_LINEAR_API_TOKEN
```

- Oder via Umgebungsvariable:

```bash
export LINEAR_API_TOKEN=YOUR_LINEAR_API_TOKEN
mcp-linear
```

## Einbindung in Clients

Du kannst den Server mit `npx` in Client-Settings einbinden, ohne globales Installieren.
Beispiel-Konfigurationen:

### Cursor (`~/.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "linear": {
      "command": "npx",
      "args": ["-y", "@tacticlaunch/mcp-linear"],
      "env": {
        "LINEAR_API_TOKEN": "<YOUR_TOKEN>"
      }
    }
  }
}
```

### Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "linear": {
      "command": "npx",
      "args": ["-y", "@tacticlaunch/mcp-linear"],
      "env": {
        "LINEAR_API_TOKEN": "<YOUR_TOKEN>"
      }
    }
  }
}
```

### Claude VS Code Extension

Datei:
`~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

```json
{
  "mcpServers": {
    "linear": {
      "command": "npx",
      "args": ["-y", "@tacticlaunch/mcp-linear"],
      "env": {
        "LINEAR_API_TOKEN": "<YOUR_TOKEN>"
      }
    }
  }
}
```

## Troubleshooting

- „Linear API token not found“: Token als `--token` oder `LINEAR_API_TOKEN` setzen.
- Netzwerkeinschränkungen/Proxy: `HTTPS_PROXY`/`HTTP_PROXY` setzen.
- Node-Version: Sicherstellen, dass `node -v` ≥ 18 ist.

## Sicherheit

- API Token niemals ins Repo einchecken.
- Für CI/Automatisierung Secrets in GitHub Actions als `LINEAR_API_TOKEN` setzen.

## Quellen

- Paket: <https://www.npmjs.com/package/@tacticlaunch/mcp-linear>
- Repo: <https://github.com/tacticlaunch/mcp-linear>

## Try it

### CLI (ohne Client)

```bash
# Variante 1: Env-Var
export LINEAR_API_TOKEN=YOUR_LINEAR_API_TOKEN
mcp-linear --version

# Variante 2: Keychain (macOS)
bash -lc 'TOKEN=$(security find-generic-password -a "abb@laparo.bizR" -s "LINEAR_API_TOKEN" -w 2>/dev/null); [ -n "$TOKEN" ] && LINEAR_API_TOKEN="$TOKEN" npx -y @tacticlaunch/mcp-linear --version'
```

### VS Code (Claude Dev)

- Öffne VS Code, starte Claude. Rufe eine Linear-Aktion auf (z. B. "Liste meine offenen Linear
  Issues").
- Falls nötig, prüfe die MCP-Serverliste der Extension – "linear" sollte sichtbar sein.

### Cursor

- Cursor neu starten, dann eine Linear-Aktion im Prompt ausführen.
- Prüfe bei Bedarf `~/.cursor/mcp.json` – Server "linear" ist konfiguriert.

## Beispiel-Prompts

Diese Eingaben kannst du in deinem MCP-Client (Claude, Cursor) verwenden:

- „Zeig mir alle offenen Linear-Issues in meinem Team.“
- „Erstelle ein neues Issue mit Titel ‚Checkout schlägt fehl‘ in Team ‚Frontend‘, Priorität hoch.“
- „Setze den Status von Issue FE-123 auf ‚In Arbeit‘.“
- „Weise Issue FE-123 der Nutzerin Anna Müller zu.“
- „Füge zu Issue FE-123 einen Kommentar hinzu: ‚Bitte bis Freitag fixen.‘“
- „Liste alle Projekte auf und zeige deren Status.“
- „Erstelle ein neues Projekt ‚Onboarding Optimierung‘ und verknüpfe Issue FE-123.“

## Tools-Referenz

Eine vollständige Liste der verfügbaren Tools findest du in der Paket-Repo unter TOOLS.md:

- <https://github.com/tacticlaunch/mcp-linear/blob/main/TOOLS.md>

## Fehlerbilder & Fixes

- 401 Unauthorized / „token invalid“:
  - Token in Linear neu generieren und in Keychain/Env aktualisieren.
  - In Clients neu starten, damit die Env übernommen wird.
- „Linear API token not found“:
  - VS Code/Cursor: Prüfe die MCP-Config-Datei; Keychain-Account/Service korrekt?
  - CLI: Nutze `--token` oder setze `LINEAR_API_TOKEN` (oder Keychain-Wrapper aus der Notiz).
- Netzwerk/Proxy-Fehler:
  - Exportiere `HTTPS_PROXY`/`HTTP_PROXY` falls nötig und teste erneut.
- Node-Version inkonsistent:
  - Sicherstellen, dass `node -v` ≥ 18 ist (Repo nutzt 22.x; NVM verwenden falls mehrere Versionen).

## Mini-Workflow: From 0 to Done

1. Issue anlegen: „Erstelle ein neues Issue ‚Checkout schlägt fehl‘ im Team Frontend, Priorität
   hoch.“

1. Zuweisen & Status setzen: „Weise das neue Issue Anna Müller zu und setze den Status auf ‚In
   Arbeit‘.“

1. Kontext ergänzen: „Füge einen Kommentar hinzu: ‚Fehler tritt bei Gast-Checkout auf; Payment
   Schritt 2.‘“

1. Verlinken/Projektbezug: „Verknüpfe das Issue mit dem Projekt ‚Onboarding Optimierung‘.“

1. Abschluss: „Setze den Status auf ‚Erledigt‘ und poste eine Abschlussnotiz.“
