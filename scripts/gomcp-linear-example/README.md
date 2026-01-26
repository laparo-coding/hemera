# GoMCP Linear Beispiel

Dieses Minimalbeispiel demonstriert, wie ein Go-Programm den Linear MCP Server
(@tacticlaunch/mcp-linear) automatisch startet und über stdio anbindet.

## Voraussetzungen

- Go 1.25+
- Node.js 20+ (siehe package.json engines)
- Linear Personal API Key (Token)

## Install

Im Ordner `scripts/gomcp-linear-example/`:

```bash
# Abhängigkeiten holen
go mod tidy
```

## Ausführen

- Variante A: Env-Var setzen

```bash
export LINEAR_API_TOKEN=YOUR_LINEAR_API_TOKEN
go run .
```

- Variante B: macOS Keychain

```bash
bash -lc 'TOKEN=$(security find-generic-password -a "abb@laparo.bizR" -s "LINEAR_API_TOKEN" -w 2>/dev/null); [ -n "$TOKEN" ] && LINEAR_API_TOKEN="$TOKEN" go run .'
```

## Hinweise

- Das Tool "list_issues" ist ein Beispiel-Toolname – passe ihn bei Bedarf an die tatsächlichen Tools
  des Linear-Servers an.
- Der Client beendet den gestarteten MCP-Server automatisch bei `Close()`.
