# Ten Thousand Tokens Monitor Skill

A Codex skill and runnable Node.js monitor for Ten Thousand Tokens by TokenWorks.

It watches Ethereum mainnet for Ten Thousand Tokens `Launched` events, extracts the launched ERC20 CA, enriches the token with metadata/market/holder data when available, and sends alerts to Telegram, Discord, Feishu/Lark, or email.

## Why This Exists

Ten Thousand Tokens does not require guessing from frontend pages. Its verified contract emits a direct launch event:

```solidity
event Launched(uint256 indexed tokenId, address indexed token, address indexed launcher, string imageURI);
```

That event is the cleanest monitoring trigger.

## Install

```bash
git clone <repo-url>
cd ten-thousand-tokens-monitor-skill
npm install
cp .env.example .env
```

Edit `.env`.

Minimum:

```bash
ETH_RPC_URL=https://ethereum-rpc.publicnode.com
TTT_CONTRACT=0x26d7ad0e930b54b84c00daad077ee31ba9e2fb2e
```

Production:

```bash
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY
```

## Run

```bash
npm run monitor
```

Live listener:

```bash
npm run watch
```

Manual enrichment test:

```bash
node scripts/ttt-monitor.js --enrich-token 0x74cd414b31459489Daa5981a76cfcc462C6B6623
```

## Notification Channels

Supported:

- Telegram bot
- Discord webhook
- Feishu/Lark custom bot
- SMTP email

See:

`references/notification-integrations.md`

## Documentation

- `SKILL.md` - Codex skill entrypoint
- `references/product-overview.md` - product mechanics
- `references/setup-and-operations.md` - deployment and operations
- `references/notification-integrations.md` - alert integrations
- `references/data-sources.md` - APIs and limitations

## Data Completeness

Launch detection only needs Ethereum RPC.

Market/holder enrichment needs third-party indexing:

- Dexscreener for price/liquidity/market cap;
- Etherscan V2 for holder concentration;
- optional OKX onchainos fallback if local auth works.

Immediately after launch, market cap and holder data may not be indexed yet. The script still alerts with CA and transaction hash.

## License

MIT
