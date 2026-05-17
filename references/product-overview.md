# Ten Thousand Tokens Product Overview / 产品说明

## 核心功能和监控逻辑 / Core Function And Monitoring Logic

这个监控器监听 Ethereum 主网上的 Ten Thousand Tokens，只在真实 token launch 发生时提醒。

This monitor watches Ten Thousand Tokens on Ethereum mainnet and alerts only when a real token launch happens.

关键不是网页更新，也不是普通的新合约创建，而是 verified protocol event：

The key signal is not a webpage update and not generic contract creation. The key signal is the verified protocol event:

```solidity
event Launched(uint256 indexed tokenId, address indexed token, address indexed launcher, string imageURI);
```

事件出现时：

When this event appears:

- `tokenId` 是走完 burn-to-launch 路径的 NFT 编号。
- `token` 是 launched ERC20 的合约地址，也就是 CA。
- `launcher` 是发射这个 token 的钱包。
- `imageURI` 是协议发出的 launch metadata 字段。

- `tokenId` is the NFT that moved through the burn-to-launch path.
- `token` is the launched ERC20 contract address, the CA.
- `launcher` is the wallet that launched it.
- `imageURI` is the launch metadata field emitted by the protocol.

之后脚本会从链上读取 ERC20 的 name、symbol、supply，并尝试用公开 indexer 补市值、流动性和持仓数据。

The monitor then reads ERC20 name, symbol, and supply directly from-chain and tries to enrich market/liquidity/holder data from public indexers.

## 这个产品是什么 / What It Is

Ten Thousand Tokens 是 TokenWorks 在 Ethereum mainnet 上的协议。它有固定 10,000 个 NFT，每个 NFT 对应一个未来可发射的 ERC20 token。这个 NFT 不只是图片，更像一个标准化发币权。

Ten Thousand Tokens is a TokenWorks protocol on Ethereum mainnet. It creates a fixed universe of 10,000 NFTs, where each NFT is tied to one future ERC20 token. The NFT is not just art; it is a standardized launch right.

核心想法：

The core idea:

- 持有 NFT = 持有一个标准化 ERC20 的发射权。
- 销毁 NFT = 通过协议发射对应 ERC20。
- 未销毁 NFT 的持有人，可以分享已发射 token 的部分手续费流。

- Holding an NFT means holding the right to launch one standardized ERC20.
- Burning the NFT launches its paired ERC20 through the protocol.
- Remaining unburned NFT holders share part of the fee flow from launched tokens.

## 合约 / Contract

NFT / protocol contract:

`0x26d7ad0e930b54b84c00daad077ee31ba9e2fb2e`

Chain:

Ethereum mainnet, chain id `1`.

Whitepaper:

`https://www.token.works/ten-thousand-tokens-whitepaper.html`

## 重要事件 / Important Events

### TokenDeployed

`TokenDeployed(uint256 indexed tokenId, address indexed token, address indexed holder)`

这个事件把 NFT id 映射到 ERC20 地址。它通常代表 token 合约已部署，但不一定代表已 launch。

This event maps an NFT id to its ERC20 contract address. It means the token contract exists, but it does not necessarily mean the token has launched.

### Launched

`Launched(uint256 indexed tokenId, address indexed token, address indexed launcher, string imageURI)`

这是最重要的监控触发器。它表示 NFT 已经通过 burn-to-launch 路径销毁，对应 ERC20 已 launch。

This is the main monitoring trigger. It means the NFT was burned through the burn-to-launch path and its paired ERC20 was launched.

## 机制 / Mechanism

1. 总量 10,000 个 NFT。
2. 每个 NFT 对应一个唯一 ERC20 合约。
3. ERC20 合约可能在正式 launch 前已经部署。
4. NFT 在协议条件满足前有 soulbound/不可转让阶段。
5. 持有人调用 `burnAndLaunch(tokenId, name, symbol, imageURI)` 发射。
6. NFT 被销毁。
7. ERC20 metadata 被写入。
8. launcher 被记录。
9. Uniswap V4 池子/流动性路径通过协议 hook 初始化。
10. 已发射 token 的手续费按协议规则流向参与者，包括 launcher 和未销毁 NFT 持有人。

1. There are 10,000 NFTs.
2. Each NFT maps to a unique ERC20 contract.
3. ERC20 contracts may be deployed before they are launched.
4. The collection has a soulbound/non-transferable phase before protocol conditions are met.
5. A holder launches by calling `burnAndLaunch(tokenId, name, symbol, imageURI)`.
6. The NFT is burned.
7. ERC20 metadata is set.
8. The launcher is recorded.
9. The Uniswap V4 pool/liquidity path is initialized through the protocol hook.
10. Fees from launched tokens are routed across protocol participants, including the launcher and unburned NFT holders.

## 监控器做什么 / What The Monitor Does

1. 检查 Ethereum mainnet 上协议合约是否存在。
2. 按区块范围扫描 `Launched` logs。
3. 保存 `lastCheckedBlock`，避免重复提醒。
4. 解析 `tokenId`、token CA、launcher、tx hash、block number。
5. 调 ERC20 `name()`、`symbol()`、`decimals()`、`totalSupply()`。
6. 尝试从 Dexscreener 获取市值、价格、流动性、成交量、pair URL。
7. 如果配置了 Etherscan API，尝试补 Top holder 集中度。
8. 只有发现一个或多个 launch 事件时才发短通知。

1. Checks that the protocol contract exists on Ethereum mainnet.
2. Scans `Launched` logs in block ranges.
3. Saves `lastCheckedBlock` to avoid duplicate alerts.
4. Parses `tokenId`, token CA, launcher, transaction hash, and block number.
5. Calls ERC20 `name()`, `symbol()`, `decimals()`, and `totalSupply()`.
6. Tries Dexscreener for market cap, price, liquidity, volume, and pair URL.
7. Optionally uses Etherscan API for top-holder concentration when configured.
8. Sends one short notification only when one or more launch events are found.

## 为什么值得监控 / Why Monitoring Matters

真正有价值的信号是 launch event。一次新 launch 会暴露：

The alpha surface is the launch event. A fresh launch reveals:

- 哪个 NFT 被销毁。
- 哪个 ERC20 CA 正式进入 launch 状态。
- launcher 选择的 token name 和 symbol。
- 市场数据是否开始出现。
- 发射早期流动性和持仓结构如何变化。

- which NFT was burned;
- which ERC20 CA is now live;
- the token name and symbol chosen by the launcher;
- whether market data begins to appear;
- how liquidity and holder distribution evolve immediately after launch.

## 常见误解 / Common Misread

不要只监控新合约创建。这个协议里，配对 ERC20 合约可能在 launch 前已经存在。生产环境最可靠的触发器是 `Launched` event。

Do not monitor only contract creation. In this protocol, paired ERC20 contracts can exist before launch. The reliable production trigger is the `Launched` event.
