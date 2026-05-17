# 产品机制说明

## 一句话概括

Ten Thousand Tokens 是一个把 NFT 设计成“发币权”的协议。每个 NFT 对应一个 ERC20，持有人可以选择销毁 NFT 来发射这个 ERC20。

监控器的目标，就是在某个 NFT 被销毁并发射 token 的第一时间，捕获对应 token CA。

## 协议合约

```text
0x26d7ad0e930b54b84c00daad077ee31ba9e2fb2e
```

链：

```text
Ethereum 主网
```

白皮书：

```text
https://www.token.works/ten-thousand-tokens-whitepaper.html
```

## 核心机制

1. 协议总共有 10,000 个 NFT。
2. 每个 NFT 对应一个唯一 ERC20。
3. ERC20 合约可以在正式发射前就部署出来。
4. 真正的发射动作是 `burnAndLaunch(...)`。
5. 调用后，NFT 被销毁。
6. 对应 ERC20 设置元数据。
7. 发射者被记录。
8. Uniswap V4 相关池子/流动性路径被初始化。
9. 合约发出 `Launched` 事件。

## 两个重要事件

### TokenDeployed

```solidity
event TokenDeployed(
  uint256 indexed tokenId,
  address indexed token,
  address indexed holder
);
```

这个事件说明某个 NFT 对应的 ERC20 地址已经部署。

但注意：**部署不等于发射。**

### Launched

```solidity
event Launched(
  uint256 indexed tokenId,
  address indexed token,
  address indexed launcher,
  string imageURI
);
```

这是监控器真正盯的事件。

它代表：

- `tokenId` 对应的 NFT 已经通过发射路径被销毁；
- `token` 是正式发射出来的 ERC20 CA；
- `launcher` 是发射者；
- 这笔交易就是新代币的发射信号。

## 为什么要盯 Launched

如果只盯“新合约创建”，会误判。

因为 TTT 的 ERC20 可能提前部署，真正值得关注的是谁把 NFT 烧掉，什么时候把 token 发射出来。

所以最可靠的信号是：

```text
Launched(tokenId, token, launcher, imageURI)
```

监控器只在这个事件出现时提醒。

## 监控器输出什么

发现发射后，脚本会输出：

- NFT 编号；
- 代币名称；
- 代币 symbol；
- token CA；
- 发射者；
- 交易哈希；
- 市值；
- 流动性；
- Top 持有人持仓比例；
- Etherscan 链接；
- Dexscreener 链接。

如果市值或持仓还没被索引，会先显示“未索引 / 暂无数据”，但仍会给出 CA 和交易链接。

## 为什么这个信号重要

这个项目真正有意思的地方是：

> 每个 NFT 自己就是一个发币权。

所以新 token 的出现，不是项目方统一公告，而是某个 NFT 持有人做出选择：烧掉 NFT，发射自己的 token。

这个动作本身就是信号。

监控器就是为了等这个信号。
