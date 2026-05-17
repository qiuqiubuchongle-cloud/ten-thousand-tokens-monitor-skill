# Ten Thousand Tokens Monitor Skill

**Core function:** monitor Ten Thousand Tokens on Ethereum mainnet. When an NFT is burned through the protocol's launch path, the monitor captures the emitted `Launched` event, extracts the newly active ERC20 token CA, enriches basic market/holder data when public indexers have it, and sends a short alert to Telegram, Discord, Feishu/Lark, or email.

**Core logic:** do not guess from webpages or contract-creation traces. The Ten Thousand Tokens contract has a verified event:

```solidity
event Launched(uint256 indexed tokenId, address indexed token, address indexed launcher, string imageURI);
```

That event is the clean signal. It means one NFT has moved through the burn-to-launch flow and its paired ERC20 token is now launched.

Alert messages are intentionally short: NFT id, token name, CA, market/liquidity, holder concentration, and links.

## Product Logic

Ten Thousand Tokens is a TokenWorks protocol built around 10,000 NFTs and 10,000 paired ERC20 tokens.

- The NFT/protocol contract lives on Ethereum mainnet.
- Each NFT maps to one ERC20 token contract.
- Many paired ERC20 contracts can already exist before they are launched.
- The important action is `burnAndLaunch(...)`: the NFT is burned, token metadata is set, the launcher is recorded, and the paired ERC20 enters its launch/trading path.
- The protocol emits `Launched(tokenId, token, launcher, imageURI)`.
- The monitor listens for this event and alerts only when a launched token appears.

Protocol contract:

```text
0x26d7ad0e930b54b84c00daad077ee31ba9e2fb2e
```

Whitepaper:

```text
https://www.token.works/ten-thousand-tokens-whitepaper.html
```

## Why This Exists

Ten Thousand Tokens does not require guessing from frontend pages. Its verified contract emits a direct launch event:

```solidity
event Launched(uint256 indexed tokenId, address indexed token, address indexed launcher, string imageURI);
```

That event is the cleanest monitoring trigger.

The common mistake is to monitor only "new contract creation." That is not enough here, because paired ERC20 contracts can be deployed earlier. This monitor watches the actual launch event.

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

Telegram alert template:

```text
TTT 新代币发射

NFT: #1234
代币: Example Token (EXAMPLE)
CA: 0x...
市值/流动性: $123,456 / $12,345

持仓: Top1 12.3% / Top10 45.6%
交易: https://etherscan.io/tx/0x...
行情: https://dexscreener.com/ethereum/...
```

If market/holder data is not indexed yet:

```text
TTT 新代币发射

NFT: #1234
代币: Example Token (EXAMPLE)
CA: 0x...
市值/流动性: 未索引 / 未索引

持仓: 暂无数据
交易: https://etherscan.io/tx/0x...
```

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
- Etherscan V2 for holder concentration.

Immediately after launch, market cap and holder data may not be indexed yet. The script still alerts with CA and transaction hash.

## License

MIT
