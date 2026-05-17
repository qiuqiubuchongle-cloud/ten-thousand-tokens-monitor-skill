# Notification Integrations / 通知接入

监控器会向所有已配置的渠道发送短通知。如果某个渠道失败，其它渠道仍然会继续发送。

The monitor sends short alerts to every configured channel. If one channel fails, the others still run.

默认通知格式 / Default alert format:

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

Telegram is the simplest notification path. The monitor sends one message only when a `Launched` event is found. Normal no-launch polling stays quiet.

### 通知模板 / Alert Template

已索引 / Indexed:

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

尚未索引 / Not indexed yet:

```text
TTT 新代币发射

NFT: #1234
代币: Example Token (EXAMPLE)
CA: 0x...
市值/流动性: 未索引 / 未索引

持仓: 暂无数据
交易: https://etherscan.io/tx/0x...
```

### 1. 创建 Bot / Create A Bot

1. 打开 Telegram。
2. 搜索 `@BotFather`。
3. 发送 `/newbot`。
4. 设置 bot 名字和 username。
5. 复制 bot token。

1. Open Telegram.
2. Search for `@BotFather`.
3. Send `/newbot`.
4. Choose a name and username.
5. Copy the bot token.

Token 长这样 / The token looks like:

```text
1234567890:AAExampleToken
```

### 2. 获取 Chat ID / Get Chat ID

私聊 / Private chat:

1. 先给你的 bot 发任意一句话，比如 `/start`。
2. 打开：

1. Send any message to your bot, for example `/start`.
2. Visit:

```text
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
```

3. 找到 `message.chat.id`，这就是 `TELEGRAM_CHAT_ID`。

3. Find `message.chat.id`; that is `TELEGRAM_CHAT_ID`.

群组 / Group:

1. 把 bot 拉进群。
2. 在群里发一句话。
3. 调用 `getUpdates`。
4. 使用负数的 group chat id。

1. Add the bot to the group.
2. Send a message in the group.
3. Call `getUpdates`.
4. Use the negative group chat id.

### 3. 配置 / Configure

```bash
TELEGRAM_BOT_TOKEN=1234567890:AAExampleToken
TELEGRAM_CHAT_ID=123456789
```

### 4. 测试 / Test

```bash
node scripts/ttt-monitor.js --enrich-token 0x74cd414b31459489Daa5981a76cfcc462C6B6623
```

手动 enrichment 只会在本地打印，不会真的发 Telegram。真实发送只发生在扫描到 `Launched` 事件时。这样可以避免测试时误推垃圾消息。

The manual enrichment path prints locally but does not send Telegram notifications. Real delivery only happens when the scan finds a `Launched` event, which avoids noisy test messages.

### 5. 安静模式 / Quiet Mode

不需要额外配置。正常轮询命令：

No extra setting is needed. The normal polling command:

```bash
npm run monitor
```

只有扫描到至少一个 `Launched` event 时，才会发送 Telegram 消息。

sends Telegram messages only when the scan finds at least one `Launched` event.

## Discord Webhook / Discord 通知

### 1. 创建 Webhook / Create Webhook

1. Open the Discord server.
2. Go to Server Settings.
3. Go to Integrations.
4. Choose Webhooks.
5. Create New Webhook.
6. Pick a channel.
7. Copy Webhook URL.

### 2. 配置 / Configure

```bash
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### 3. 备注 / Notes

Discord 消息有长度限制。脚本会截断过长内容，避免超过常见 webhook 限制。

Discord message content has size limits. The script truncates message content to stay under the common webhook limit.

## Feishu / Lark / 飞书

### 1. 创建自定义机器人 / Create Custom Bot

1. Open a Feishu/Lark group.
2. Open group settings.
3. Choose Bots.
4. Add Custom Bot.
5. Copy the webhook URL.

### 2. 可选签名密钥 / Optional Signature Secret

如果开启了签名校验，复制 bot secret。

If signature verification is enabled, copy the bot secret.

### 3. 配置 / Configure

无签名 / Without signature:

```bash
FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/...
```

有签名 / With signature:

```bash
FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/...
FEISHU_SECRET=your_secret
```

### 4. 备注 / Notes

脚本发送 text message payload：

The script sends a text message payload:

```json
{
  "msg_type": "text",
  "content": {
    "text": "alert text"
  }
}
```

如果配置了 `FEISHU_SECRET`，脚本会按 timestamp + secret 标准格式做 HMAC-SHA256 签名。

When `FEISHU_SECRET` is present, the script signs with HMAC-SHA256 using the standard timestamp plus secret format.

## Email SMTP / 邮箱

### 1. 选择 SMTP 服务 / Pick SMTP Provider

常见选择 / Common options:

- Gmail App Password
- Outlook SMTP
- SendGrid
- Mailgun
- AWS SES

### 2. 配置 / Configure

通用 TLS 587 / Generic TLS-on-587:

```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=0
SMTP_USER=alerts@example.com
SMTP_PASS=your_password_or_app_password
EMAIL_FROM=alerts@example.com
EMAIL_TO=you@example.com
```

SSL 465 / SSL-on-465:

```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_SECURE=1
SMTP_USER=alerts@example.com
SMTP_PASS=your_password_or_app_password
EMAIL_FROM=alerts@example.com
EMAIL_TO=you@example.com
```

### 3. Gmail 示例 / Gmail Example

请使用 App Password，不要使用普通 Google 密码。

Use an app password, not your normal Google password:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=1
SMTP_USER=yourname@gmail.com
SMTP_PASS=your_16_character_app_password
EMAIL_FROM=yourname@gmail.com
EMAIL_TO=destination@example.com
```

## 多渠道配置 / Multi-Channel Setup

可以同时开启多个通知渠道：

You can enable multiple channels at once:

```bash
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
DISCORD_WEBHOOK_URL=...
FEISHU_WEBHOOK_URL=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=1
SMTP_USER=...
SMTP_PASS=...
EMAIL_TO=...
```

脚本会向每个已配置的目标发送通知。

The script sends to every configured destination.
