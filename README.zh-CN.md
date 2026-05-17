# Ten Thousand Tokens 发射监控 Skill

**核心功能：** 监控 Ethereum 主网上的 Ten Thousand Tokens。当某个 NFT 通过协议的 `burnAndLaunch` 路径被销毁并发射对应 ERC20 时，脚本会捕获链上的 `Launched` 事件，拿到新发射代币的 CA，并在公开数据源已索引时补充市值、流动性、持仓集中度，然后通过 Telegram、Discord、飞书/Lark 或邮箱发送一条短通知。

**核心逻辑：** 不靠网页、不靠猜新合约、不靠前端数据。Ten Thousand Tokens 合约有 verified event：

```solidity
event Launched(uint256 indexed tokenId, address indexed token, address indexed launcher, string imageURI);
```

这个事件就是最干净的发射信号。它出现时，说明某个 NFT 已经走完 burn-to-launch 流程，对应 ERC20 已正式 launch。

通知默认保持很短：NFT 编号、代币名、CA、市值/流动性、持仓集中度和链接。

## 产品逻辑

Ten Thousand Tokens 是 TokenWorks 在 Ethereum 主网上的协议，围绕 10,000 个 NFT 和 10,000 个配对 ERC20 token 设计。

- NFT/protocol 合约在 Ethereum mainnet。
- 每个 NFT 对应一个 ERC20 token 合约。
- 很多 ERC20 合约可能在正式 launch 前就已经部署。
- 关键动作是 `burnAndLaunch(...)`：NFT 被销毁，token metadata 被写入，launcher 被记录，对应 ERC20 进入 launch/trading 路径。
- 协议发出 `Launched(tokenId, token, launcher, imageURI)`。
- 监控脚本监听这个事件，只在真正有 launched token 时通知。

协议合约：

```text
0x26d7ad0e930b54b84c00daad077ee31ba9e2fb2e
```

白皮书：

```text
https://www.token.works/ten-thousand-tokens-whitepaper.html
```

## 为什么需要这个监控

Ten Thousand Tokens 不需要从前端页面猜状态。常见误区是只监控“新合约创建”。这对 TTT 不够，因为配对 ERC20 可能提前部署。这个监控脚本看的是真正的 launch 事件。

## 安装

```bash
git clone <repo-url>
cd ten-thousand-tokens-monitor-skill
npm install
cp .env.example .env
```

编辑 `.env`。

最低配置：

```bash
ETH_RPC_URL=https://ethereum-rpc.publicnode.com
TTT_CONTRACT=0x26d7ad0e930b54b84c00daad077ee31ba9e2fb2e
```

长期运行建议使用自己的 RPC：

```bash
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY
```

## 运行

轮询一次：

```bash
npm run monitor
```

实时监听：

```bash
npm run watch
```

手动测试一个已部署 token：

```bash
node scripts/ttt-monitor.js --enrich-token 0x74cd414b31459489Daa5981a76cfcc462C6B6623
```

## 通知渠道

支持：

- Telegram bot
- Discord webhook
- 飞书或 Lark 自定义机器人
- 邮箱 SMTP

详细教程：

- [通知接入](references/notification-integrations.zh-CN.md)

Telegram 通知模板：

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

如果刚发射还没被索引：

```text
TTT 新代币发射

NFT: #1234
代币: Example Token (EXAMPLE)
CA: 0x...
市值/流动性: 未索引 / 未索引

持仓: 暂无数据
交易: https://etherscan.io/tx/0x...
```

## 文档

- `SKILL.md` - Codex skill 入口
- [产品机制](references/product-overview.zh-CN.md)
- [部署和运维](references/setup-and-operations.md)
- [通知渠道接入](references/notification-integrations.zh-CN.md)
- [数据源和限制](references/data-sources.md)

## 数据完整度

发现 launch 只需要 Ethereum RPC。

市值/持仓增强依赖第三方索引：

- Dexscreener: 价格、流动性、市值
- Etherscan V2: 持仓集中度

刚发射时，市值和持有人数据可能还没被索引。脚本仍会先发 CA 和交易哈希。

## License

MIT
