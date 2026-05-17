# Ten Thousand Tokens Monitor Skill / TTT 发射监控 Skill

**核心功能：** 监控 Ethereum 主网上的 Ten Thousand Tokens。当某个 NFT 通过协议的 `burnAndLaunch` 路径被销毁并发射对应 ERC20 时，脚本会捕获链上的 `Launched` 事件，拿到新发射代币的 CA，并在公开数据源已索引时补充市值、流动性、持仓集中度，然后通过 Telegram、Discord、飞书/Lark 或邮箱发送一条短通知。

**Core function:** monitor Ten Thousand Tokens on Ethereum mainnet. When an NFT is burned through the protocol's `burnAndLaunch` path and its paired ERC20 is launched, the monitor captures the on-chain `Launched` event, extracts the token CA, enriches market/liquidity/holder data when public indexers have it, and sends a short alert to Telegram, Discord, Feishu/Lark, or email.

**核心逻辑：** 不靠网页、不靠猜新合约、不靠前端数据。Ten Thousand Tokens 合约有 verified event：

**Core logic:** do not rely on webpages, frontend state, or guessing from new contract creation. The Ten Thousand Tokens contract emits a verified event:

```solidity
event Launched(uint256 indexed tokenId, address indexed token, address indexed launcher, string imageURI);
```

这个事件就是最干净的发射信号。它出现时，说明某个 NFT 已经走完 burn-to-launch 流程，对应 ERC20 已正式 launch。

This event is the clean launch signal. When it appears, one NFT has completed the burn-to-launch flow and its paired ERC20 is live.

通知默认保持很短：NFT 编号、代币名、CA、市值/流动性、持仓集中度和链接。

Alerts are intentionally short: NFT id, token name, CA, market/liquidity, holder concentration, and links.

## 产品逻辑 / Product Logic

Ten Thousand Tokens 是 TokenWorks 在 Ethereum 主网上的协议，围绕 10,000 个 NFT 和 10,000 个配对 ERC20 token 设计。

Ten Thousand Tokens is a TokenWorks protocol on Ethereum mainnet, built around 10,000 NFTs and 10,000 paired ERC20 tokens.

- NFT/protocol 合约在 Ethereum mainnet。
- 每个 NFT 对应一个 ERC20 token 合约。
- 很多 ERC20 合约可能在正式 launch 前就已经部署。
- 关键动作是 `burnAndLaunch(...)`：NFT 被销毁，token metadata 被写入，launcher 被记录，对应 ERC20 进入 launch/trading 路径。
- 协议发出 `Launched(tokenId, token, launcher, imageURI)`。
- 监控脚本监听这个事件，只在真正有 launched token 时通知。

- The NFT/protocol contract lives on Ethereum mainnet.
- Each NFT maps to one ERC20 token contract.
- Many paired ERC20 contracts may already exist before launch.
- The key action is `burnAndLaunch(...)`: the NFT is burned, token metadata is set, the launcher is recorded, and the paired ERC20 enters its launch/trading path.
- The protocol emits `Launched(tokenId, token, launcher, imageURI)`.
- The monitor listens for this event and alerts only when a launched token appears.

Protocol contract / 协议合约：

```text
0x26d7ad0e930b54b84c00daad077ee31ba9e2fb2e
```

Whitepaper / 白皮书：

```text
https://www.token.works/ten-thousand-tokens-whitepaper.html
```

## 为什么需要这个监控 / Why This Exists

Ten Thousand Tokens 不需要从前端页面猜状态。verified contract 直接发出 launch 事件：

Ten Thousand Tokens does not require guessing from frontend pages. Its verified contract emits a direct launch event:

```solidity
event Launched(uint256 indexed tokenId, address indexed token, address indexed launcher, string imageURI);
```

常见误区是只监控“新合约创建”。这对 TTT 不够，因为配对 ERC20 可能提前部署。这个监控脚本看的是真正的 launch 事件。

The common mistake is to monitor only "new contract creation." That is not enough here because paired ERC20 contracts can be deployed earlier. This monitor watches the actual launch event.

## 安装 / Install

```bash
git clone <repo-url>
cd ten-thousand-tokens-monitor-skill
npm install
cp .env.example .env
```

编辑 `.env`。

Edit `.env`.

最低配置 / Minimum:

```bash
ETH_RPC_URL=https://ethereum-rpc.publicnode.com
TTT_CONTRACT=0x26d7ad0e930b54b84c00daad077ee31ba9e2fb2e
```

长期运行建议使用自己的 RPC。

For long-running production use, use your own RPC.

```bash
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY
```

## 运行 / Run

轮询一次 / Poll once:

```bash
npm run monitor
```

实时监听 / Live listener:

```bash
npm run watch
```

手动测试一个已部署 token / Manual enrichment test:

```bash
node scripts/ttt-monitor.js --enrich-token 0x74cd414b31459489Daa5981a76cfcc462C6B6623
```

## 通知渠道 / Notification Channels

支持 / Supported:

- Telegram bot
- Discord webhook
- Feishu/Lark custom bot / 飞书或 Lark 自定义机器人
- SMTP email / 邮箱

详细教程见：

See details:

`references/notification-integrations.md`

Telegram 通知模板 / Telegram alert template:

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

如果刚发射还没被索引 / If market or holder data is not indexed yet:

```text
TTT 新代币发射

NFT: #1234
代币: Example Token (EXAMPLE)
CA: 0x...
市值/流动性: 未索引 / 未索引

持仓: 暂无数据
交易: https://etherscan.io/tx/0x...
```

## 文档 / Documentation

- `SKILL.md` - Codex skill entrypoint / Codex skill 入口
- `references/product-overview.md` - product mechanics / 产品机制
- `references/setup-and-operations.md` - deployment and operations / 部署和运维
- `references/notification-integrations.md` - alert integrations / 通知渠道接入
- `references/data-sources.md` - APIs and limitations / 数据源和限制

## 数据完整度 / Data Completeness

发现 launch 只需要 Ethereum RPC。

Launch detection only needs Ethereum RPC.

市值/持仓增强依赖第三方索引：

Market/holder enrichment depends on third-party indexers:

- Dexscreener: price, liquidity, market cap / 价格、流动性、市值
- Etherscan V2: holder concentration / 持仓集中度

刚发射时，市值和持有人数据可能还没被索引。脚本仍会先发 CA 和交易哈希。

Immediately after launch, market cap and holder data may not be indexed yet. The script still alerts with CA and transaction hash.

## License / 许可证

MIT
