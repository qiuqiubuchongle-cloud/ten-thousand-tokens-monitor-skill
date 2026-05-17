# Ten Thousand Tokens 发射监控 Skill

这是一个用于监控 **Ten Thousand Tokens / TokenWorks TTT** 的 Codex Skill 和 Node.js 脚本。

它的核心功能很简单：**监听 Ethereum 主网上的 Ten Thousand Tokens `Launched` 事件，一旦某个 NFT 被销毁并发射出对应 ERC20，就把新代币的 CA 和基础数据推送出来。**

## 这个项目解决什么问题

Ten Thousand Tokens 的玩法不是普通的“项目方统一发币”。它的设计更像是：

- 总共有 10,000 个 NFT；
- 每个 NFT 对应一个独立 ERC20；
- NFT 持有人可以通过 `burnAndLaunch(...)` 销毁 NFT；
- 销毁后，对应 ERC20 正式进入 launch 路径；
- 合约会发出 `Launched(tokenId, token, launcher, imageURI)` 事件。

所以真正值得监控的不是网页，不是社媒，也不是“有没有新合约部署”，而是 **主合约有没有发出 `Launched` 事件**。

这个脚本就是专门等这个事件。

## 核心监控逻辑

Ten Thousand Tokens 主合约：

```text
0x26d7ad0e930b54b84c00daad077ee31ba9e2fb2e
```

链：

```text
Ethereum 主网
```

关键事件：

```solidity
event Launched(
  uint256 indexed tokenId,
  address indexed token,
  address indexed launcher,
  string imageURI
);
```

脚本会做这些事：

1. 连接 Ethereum RPC。
2. 扫描 Ten Thousand Tokens 主合约的 `Launched` 日志。
3. 如果发现新事件，解析出：
   - NFT 编号；
   - 发射出的 ERC20 CA；
   - launcher；
   - 交易哈希；
   - 区块号。
4. 读取 ERC20 的：
   - `name()`
   - `symbol()`
   - `decimals()`
   - `totalSupply()`
5. 尝试从 Dexscreener 获取：
   - 市值；
   - 价格；
   - 流动性；
   - 24h 成交量；
   - 行情链接。
6. 如果配置了 Etherscan API，尝试补充：
   - Top 持有人；
   - Top1 / Top10 持仓比例。
7. 只有发现新代币发射时才发送通知。

没有新发射时，脚本只更新本地状态，不会发无意义提醒。

## 为什么不能只监控新合约

这是最容易误解的地方。

Ten Thousand Tokens 里，ERC20 合约可能在 NFT mint / token deployment 阶段就已经存在。比如：

```text
TokenDeployed(tokenId, token, holder)
```

这个事件只能说明某个 NFT 对应的 ERC20 合约地址已经部署出来，但不代表它已经正式发射。

真正代表“发射”的事件是：

```text
Launched(tokenId, token, launcher, imageURI)
```

所以这个监控器不会把“新合约创建”当成信号，而是以 `Launched` 为准。

## 通知长什么样

默认通知很短，方便手机上直接看：

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

如果刚发射，第三方数据还没索引，会显示：

```text
TTT 新代币发射

NFT: #1234
代币: Example Token (EXAMPLE)
CA: 0x...
市值/流动性: 未索引 / 未索引

持仓: 暂无数据
交易: https://etherscan.io/tx/0x...
```

## 支持的通知渠道

目前支持：

- Telegram Bot
- Discord Webhook
- 飞书自定义机器人
- SMTP 邮箱

详细配置见：

```text
references/notification-integrations.md
```

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

公开 RPC 可以测试，但长期监控建议换成自己的 RPC：

```bash
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
```

如果你想获取持仓集中度，可以再配置：

```bash
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY
```

不配置 Etherscan 也能正常监控，只是持有人数量和 Top 持仓比可能显示暂无。

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

这个测试地址是 `TenThousandTokens #10000` 对应的 ERC20：

```text
0x74cd414b31459489Daa5981a76cfcc462C6B6623
```

它用于测试元数据和数据补全逻辑，不代表这个 token 已经正式发射。

## 本地状态

脚本会用 `state.json` 记录上次检查到的区块：

```json
{
  "lastCheckedBlock": 25112345,
  "updatedAt": "2026-05-17T..."
}
```

这样重复运行时不会重复提醒。

## 生产环境建议

长期运行建议用 cron 或 systemd，而不是一直开着 `npm run watch`。

cron 示例：

```cron
* * * * * cd /path/to/ten-thousand-tokens-monitor-skill && /usr/local/bin/npm run monitor >> logs/ttt-monitor.log 2>&1
```

如果你要用 Telegram 且本机访问 Telegram API 需要代理，可以这样运行：

```bash
HTTPS_PROXY=http://127.0.0.1:7897 HTTP_PROXY=http://127.0.0.1:7897 npm run monitor
```

## 数据源说明

### Ethereum RPC

必须，用于：

- 扫描 `Launched` 事件；
- 读取 ERC20 元数据；
- 获取区块高度；
- 保存监控进度。

### Dexscreener

零配置，用于尝试获取：

- 市值；
- 价格；
- 流动性；
- 成交量；
- 行情链接。

刚发射的新 token 可能还没被索引，所以这部分可能为空。

### Etherscan API

可选，用于尝试获取 Top 持有人和持仓集中度。

不配置也不影响主监控。

## 相关文档

- 产品机制：`references/product-overview.md`
- 部署和运维：`references/setup-and-operations.md`
- 通知接入：`references/notification-integrations.md`
- 数据源说明：`references/data-sources.md`

## 白皮书

```text
https://www.token.works/ten-thousand-tokens-whitepaper.html
```

## 许可证

MIT
