# 安装与运行

这份文档说明如何在本地、服务器、定时任务或 GitHub Actions 中运行监控脚本。

## 环境要求

- Node.js 20 或更高版本
- npm
- Ethereum RPC 地址
- 可选的 Etherscan API Key，用于补全持仓集中度
- 可选的通知渠道配置，比如 Telegram、Discord、飞书或邮箱

## 安装

```bash
cd ten-thousand-tokens-monitor-skill
npm install
cp .env.example .env
```

然后编辑 `.env`。

最小配置：

```bash
ETH_RPC_URL=https://ethereum-rpc.publicnode.com
TTT_CONTRACT=0x26d7ad0e930b54b84c00daad077ee31ba9e2fb2e
```

生产环境建议使用自己的付费或稳定 RPC：

```bash
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
```

PublicNode 这类公共 RPC 可以用于测试，但不适合长期大范围扫描。

## 单次轮询

```bash
npm run monitor
```

脚本会读取状态文件里的 `lastCheckedBlock`，从下一个区块开始扫描。如果没有状态文件，会默认回看最近 `LOOKBACK_BLOCKS` 个区块。

状态文件默认是 `scripts/state.json`，可以通过 `STATE_FILE` 修改位置。

## 实时监听

```bash
npm run watch
```

这个模式会保持一个监听器。生产环境更推荐定时轮询，因为公共 RPC 的订阅连接可能静默断开，而定时轮询更容易恢复和排查。

## 手动测试代币补全

可以用一个已知的配对代币测试元数据、Dexscreener 和持仓数据补全：

```bash
node scripts/ttt-monitor.js --enrich-token 0x74cd414b31459489Daa5981a76cfcc462C6B6623
```

这个命令只在本地打印结果，不会发送通知。

预期能读到的基础信息：

- name: `TenThousandTokens #10000`
- symbol: `TTT-10000`
- total supply: `1,000,000,000`

## 回扫 TokenDeployed

如果你想检查 NFT tokenId 与 ERC20 CA 的映射，可以运行：

```bash
node scripts/ttt-monitor.js --backfill-deployed --no-state --from 25100000 --to 25112164
```

公共 RPC 容易限流，回扫时建议使用小区块范围分段执行。

## Cron 定时运行

每分钟运行一次：

```cron
* * * * * cd /path/to/ten-thousand-tokens-monitor-skill && /usr/local/bin/npm run monitor >> logs/ttt-monitor.log 2>&1
```

建议：

- 先创建 `logs/` 目录；
- 用 `which npm` 查到 npm 的绝对路径；
- 使用能读取 `.env` 的用户运行；
- 把 `STATE_FILE` 放在稳定路径，避免状态丢失。

## systemd 运行

Timer unit：

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

Service unit：

```ini
[Unit]
Description=Ten Thousand Tokens monitor

[Service]
Type=oneshot
WorkingDirectory=/path/to/ten-thousand-tokens-monitor-skill
ExecStart=/usr/bin/npm run monitor
```

## GitHub Actions

可以用 GitHub Actions 做定时轮询：

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

注意：GitHub Actions 的临时文件系统默认不会在不同轮询之间保留 `state.json`。如果要长期使用 Actions，建议接入外部状态存储，或者缩短 `LOOKBACK_BLOCKS` 并在通知端去重。

## 环境变量

核心配置：

```bash
ETH_RPC_URL=
TTT_CONTRACT=0x26d7ad0e930b54b84c00daad077ee31ba9e2fb2e
STATE_FILE=./state.json
CONFIRMATIONS=2
SCAN_CHUNK=2000
LOOKBACK_BLOCKS=5000
```

行情与持仓：

```bash
ETHERSCAN_API_KEY=
```

通知渠道：

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

## 常见问题

如果没有通知，先确认最近是否真的出现了新的 `Launched` 事件。这个脚本默认安静运行，没有新发射就不会推送。

如果能读到链上事件，但没有市值或流动性，通常是 Dexscreener 还没有索引，等一段时间再查即可。

如果持仓数据为空，通常是没有配置 `ETHERSCAN_API_KEY`，或者 Etherscan 对新代币的持有人数据还没更新。
