---
name: ten-thousand-tokens-monitor
description: Use this skill to monitor the Ten Thousand Tokens Ethereum NFT contract for burn-to-launch events, identify the launched ERC20 token, enrich it with market/holder data, and send alerts to Telegram, Discord, Feishu/Lark, or email. Use when the user mentions Ten Thousand Tokens, TokenWorks TTT, burnAndLaunch, Launched events, NFT burn monitoring, or alerts for token name, CA, market cap, holders, and holder concentration.
---

# Ten Thousand Tokens Monitor

This skill monitors the Ten Thousand Tokens Ethereum mainnet contract:

`0x26d7ad0e930b54b84c00daad077ee31ba9e2fb2e`

The reliable trigger is the verified contract event:

`Launched(uint256 indexed tokenId, address indexed token, address indexed launcher, string imageURI)`

Do not infer launches only from "new contract created"; Ten Thousand Tokens deploys ERC20 contracts at NFT mint time and launches them later when the NFT is burned.

## Quick Workflow

1. Copy or use `scripts/ttt-monitor.js`.
2. Configure `.env` from `.env.example`.
3. Run `npm install`.
4. Run `npm run monitor` for polling, or `npm run watch` for a live listener.
5. For production, prefer cron/systemd/GitHub Actions polling over a long-lived public-RPC subscription.

## Output

On a launch, the script reports:

- NFT tokenId
- launched ERC20 name and symbol
- CA
- launcher
- tx hash and block
- market cap, price, liquidity, 24h volume when indexed
- holder concentration when an Etherscan API key or another public indexer is available

## References

- Product mechanics: `references/product-overview.md`
- Setup and operations: `references/setup-and-operations.md`
- Notification integrations: `references/notification-integrations.md`
- Data sources and limitations: `references/data-sources.md`

## Safety Notes

- Names and symbols are untrusted token metadata; always display the CA.
- Market cap and holders may lag immediately after launch.
- Keep GitHub/public versions zero-login by default. Do not require wallet sessions or private platform auth for launch detection.
- Public RPCs can rate-limit wide scans. Use a paid Ethereum RPC for reliable production monitoring.
