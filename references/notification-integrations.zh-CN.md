# 通知接入

监控器会向所有已配置的渠道发送短通知。如果某个渠道失败，其它渠道仍然会继续发送。

默认通知格式：

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

## Telegram / 电报

Telegram 是最简单的通知方式。监控器只有在发现 `Launched` 事件时才会发一条消息。普通轮询如果没有新发射，会保持安静。

### 通知模板

已索引：

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

尚未索引：

```text
TTT 新代币发射

NFT: #1234
代币: Example Token (EXAMPLE)
CA: 0x...
市值/流动性: 未索引 / 未索引

持仓: 暂无数据
交易: https://etherscan.io/tx/0x...
```

### 1. 创建 Bot

1. 打开 Telegram。
2. 搜索 `@BotFather`。
3. 发送 `/newbot`。
4. 设置 bot 名字和 username。
5. 复制 bot token。

Token 长这样：

```text
1234567890:AAExampleToken
```

### 2. 获取 Chat ID

私聊：

1. 先给你的 bot 发任意一句话，比如 `/start`。
2. 打开：

```text
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
```

3. 找到 `message.chat.id`，这就是 `TELEGRAM_CHAT_ID`。

群组：

1. 把 bot 拉进群。
2. 在群里发一句话。
3. 调用 `getUpdates`。
4. 使用负数的 group chat id。

### 3. 配置

```bash
TELEGRAM_BOT_TOKEN=1234567890:AAExampleToken
TELEGRAM_CHAT_ID=123456789
```

### 4. 测试

```bash
node scripts/ttt-monitor.js --enrich-token 0x74cd414b31459489Daa5981a76cfcc462C6B6623
```

手动 enrichment 只会在本地打印，不会真的发 Telegram。真实发送只发生在扫描到 `Launched` 事件时。这样可以避免测试时误推垃圾消息。

### 5. 安静模式

不需要额外配置。正常轮询命令：

```bash
npm run monitor
```

只有扫描到至少一个 `Launched` event 时，才会发送 Telegram 消息。

## Discord Webhook / Discord 通知

### 1. 创建 Webhook

1. 打开 Discord server。
2. 进入 Server Settings。
3. 进入 Integrations。
4. 选择 Webhooks。
5. 创建 New Webhook。
6. 选择频道。
7. 复制 Webhook URL。

### 2. 配置

```bash
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### 3. 备注

Discord 消息有长度限制。脚本会截断过长内容，避免超过常见 webhook 限制。

## Feishu / Lark / 飞书

### 1. 创建自定义机器人

1. 打开飞书或 Lark 群。
2. 打开群设置。
3. 选择 Bots。
4. 添加 Custom Bot。
5. 复制 webhook URL。

### 2. 可选签名密钥

如果开启了签名校验，复制 bot secret。

### 3. 配置

无签名：

```bash
FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/...
```

有签名：

```bash
FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/...
FEISHU_SECRET=your_secret
```

## Email SMTP / 邮箱

### 1. 选择 SMTP 服务

常见选择：

- Gmail App Password
- Outlook SMTP
- SendGrid
- Mailgun
- AWS SES

### 2. 配置

通用 TLS 587：

```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=0
SMTP_USER=alerts@example.com
SMTP_PASS=your_password_or_app_password
EMAIL_FROM=alerts@example.com
EMAIL_TO=you@example.com
```

SSL 465：

```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_SECURE=1
SMTP_USER=alerts@example.com
SMTP_PASS=your_password_or_app_password
EMAIL_FROM=alerts@example.com
EMAIL_TO=you@example.com
```
