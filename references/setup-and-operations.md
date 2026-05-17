# Setup And Operations

## Requirements

- Node.js 20+
- npm
- Ethereum RPC URL
- Optional Etherscan API key
- Optional OKX onchainos CLI
- Optional notification credentials

## Install

```bash
cd ten-thousand-tokens-monitor-skill
npm install
cp .env.example .env
```

Edit `.env`.

Minimum config:

```bash
ETH_RPC_URL=https://ethereum-rpc.publicnode.com
TTT_CONTRACT=0x26d7ad0e930b54b84c00daad077ee31ba9e2fb2e
```

Production config should use a private RPC:

```bash
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
```

## Run Once

```bash
npm run monitor
```

The script scans from `state.json.lastCheckedBlock + 1`. If no state exists, it scans the last `LOOKBACK_BLOCKS`.

## Live Watch

```bash
npm run watch
```

This keeps a listener open. For production, polling is often safer because public RPC subscriptions can disconnect silently.

## Manual Test

Test enrichment for a known paired token:

```bash
node scripts/ttt-monitor.js --enrich-token 0x74cd414b31459489Daa5981a76cfcc462C6B6623
```

Expected metadata:

- name: `TenThousandTokens #10000`
- symbol: `TTT-10000`
- total supply: `1,000,000,000`

## Backfill TokenDeployed

Use this to inspect tokenId to ERC20 mappings:

```bash
node scripts/ttt-monitor.js --backfill-deployed --no-state --from 25100000 --to 25112164
```

Use smaller ranges on public RPCs.

## Cron

Run every minute:

```cron
* * * * * cd /path/to/ten-thousand-tokens-monitor-skill && /usr/local/bin/npm run monitor >> logs/ttt-monitor.log 2>&1
```

Recommended:

- create a `logs/` directory;
- use an absolute `npm` path from `which npm`;
- run under a user account that can read `.env`.

## systemd

Timer unit:

```ini
[Unit]
Description=Ten Thousand Tokens monitor timer

[Timer]
OnBootSec=30
OnUnitActiveSec=60
Unit=ttt-monitor.service

[Install]
WantedBy=timers.target
```

Service unit:

```ini
[Unit]
Description=Ten Thousand Tokens monitor

[Service]
Type=oneshot
WorkingDirectory=/path/to/ten-thousand-tokens-monitor-skill
ExecStart=/usr/bin/npm run monitor
```

## GitHub Actions

Cron workflow:

```yaml
name: TTT Monitor

on:
  schedule:
    - cron: "* * * * *"
  workflow_dispatch:

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run monitor
        env:
          ETH_RPC_URL: ${{ secrets.ETH_RPC_URL }}
          ETHERSCAN_API_KEY: ${{ secrets.ETHERSCAN_API_KEY }}
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
```

Important: GitHub Actions ephemeral storage does not preserve `state.json` between runs unless committed or cached. For GitHub Actions, prefer a small external state store, or set a short `LOOKBACK_BLOCKS` and deduplicate at the alert destination.

## Environment Variables

Core:

```bash
ETH_RPC_URL=
TTT_CONTRACT=0x26d7ad0e930b54b84c00daad077ee31ba9e2fb2e
STATE_FILE=./state.json
CONFIRMATIONS=2
SCAN_CHUNK=2000
LOOKBACK_BLOCKS=5000
```

Market/holder data:

```bash
ETHERSCAN_API_KEY=
USE_OKX=0
ONCHAINOS_PATH=onchainos
```

Notifications:

```bash
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
DISCORD_WEBHOOK_URL=
FEISHU_WEBHOOK_URL=
FEISHU_SECRET=
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=0
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
EMAIL_TO=
```
