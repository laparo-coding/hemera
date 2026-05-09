#!/usr/bin/env bash

set -euo pipefail

response_body="$(cat)"
normalized_body="$(printf '%s' "$response_body" | tr '\n' ' ')"
vercel_protection_regex='(vercel\.com/(login|sso-api)|protected by vercel|'
vercel_protection_regex+="((security checkpoint|access denied|authentication required|verify you are human).{0,160}(vercel|preview deployment protection|deployment protection))|"
vercel_protection_regex+="((vercel|preview deployment protection|deployment protection).{0,160}(security checkpoint|access denied|authentication required|verify you are human)))"

if grep -Eqi "$vercel_protection_regex" <<< "$normalized_body"; then
  exit 0
fi

exit 1