---
name: ten-thousand-tokens-monitor
description: 监控 Ethereum 主网 Ten Thousand Tokens NFT 的销毁发射事件，识别发射出来的 ERC20 代币 CA，补全市值、流动性、持仓集中度，并发送 Telegram、Discord、飞书或邮箱通知。
---

# Ten Thousand Tokens 监控 Skill

这个 skill 用来监控 Ethereum 主网上的 Ten Thousand Tokens NFT 合约：

`0x26d7ad0e930b54b84c00daad077ee31ba9e2fb2e`

最可靠的触发信号是合约已验证的事件：

`Launched(uint256 indexed tokenId, address indexed token, address indexed launcher, string imageURI)`

不要只根据“新合约创建”判断发射。Ten Thousand Tokens 的逻辑是 NFT mint 时可能已经部署对应 ERC20，真正的公开发射发生在 NFT 被销毁并执行发射路径时。

## 快速流程

1. 使用 `scripts/ttt-monitor.js`。
2. 从 `.env.example` 复制出 `.env`。
3. 运行 `npm install`。
4. 运行 `npm run monitor` 做轮询，或运行 `npm run watch` 做实时监听。
5. 生产环境更推荐 cron、systemd 或 GitHub Actions 轮询。

## 输出内容

发现发射后，脚本会输出：

- NFT tokenId；
- 发射出来的 ERC20 name 和 symbol；
- CA；
- launcher；
- 交易哈希和区块；
- 已索引时的市值、价格、流动性、24 小时交易量；
- 有 Etherscan API Key 时的持仓集中度。

## 参考文档

- 产品机制：`references/product-overview.md`
- 安装与运行：`references/setup-and-operations.md`
- 通知接入：`references/notification-integrations.md`
- 数据源与限制：`references/data-sources.md`

## 注意事项

- name 和 symbol 是代币元数据，不等于安全背书，通知里必须展示 CA。
- 新发射代币的市值、流动性和持有人数据可能延迟。
- GitHub 公共版本默认不依赖钱包登录、OKX API 或私有平台权限。
- 公共 RPC 可能限流，长期运行建议使用稳定的 Ethereum RPC。
