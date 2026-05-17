# Notification Integrations

The monitor sends short alerts to every configured channel. If one channel fails, the others still run.

Default alert format:

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

## Telegram

Telegram is the simplest notification path. The monitor sends one message only when a `Launched` event is found. Normal no-launch polling stays quiet.

### Alert Template

Indexed:

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

Not indexed yet:

```text
TTT 新代币发射

NFT: #1234
代币: Example Token (EXAMPLE)
CA: 0x...
市值/流动性: 未索引 / 未索引

持仓: 暂无数据
交易: https://etherscan.io/tx/0x...
```

### 1. Create A Bot

1. Open Telegram.
2. Search for `@BotFather`.
3. Send `/newbot`.
4. Choose a name and username.
5. Copy the bot token.

The token looks like:

```text
1234567890:AAExampleToken
```

### 2. Get Chat ID

Private chat:

1. Send any message to your bot, for example `/start`.
2. Visit:

```text
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
```

3. Find `message.chat.id`; that is `TELEGRAM_CHAT_ID`.

Group:

1. Add the bot to the group.
2. Send a message in the group.
3. Call `getUpdates`.
4. Use the negative group chat id.

### 3. Configure

```bash
TELEGRAM_BOT_TOKEN=1234567890:AAExampleToken
TELEGRAM_CHAT_ID=123456789
```

### 4. Test

```bash
node scripts/ttt-monitor.js --enrich-token 0x74cd414b31459489Daa5981a76cfcc462C6B6623
```

The manual enrichment path prints locally but does not send Telegram notifications. Real delivery only happens when the scan finds a `Launched` event, which avoids noisy test messages.

### 5. Quiet Mode

No extra setting is needed. The normal polling command:

```bash
npm run monitor
```

sends Telegram messages only when the scan finds at least one `Launched` event.

## Discord Webhook

### 1. Create Webhook

1. Open the Discord server.
2. Go to Server Settings.
3. Go to Integrations.
4. Choose Webhooks.
5. Create New Webhook.
6. Pick a channel.
7. Copy Webhook URL.

### 2. Configure

```bash
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### 3. Notes

Discord message content has size limits. The script truncates message content to stay under the common webhook limit.

## Feishu / Lark

### 1. Create Custom Bot

1. Open a Feishu/Lark group.
2. Open group settings.
3. Choose Bots.
4. Add Custom Bot.
5. Copy the webhook URL.

### 2. Optional Signature Secret

If signature verification is enabled, copy the bot secret.

### 3. Configure

Without signature:

```bash
FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/...
```

With signature:

```bash
FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/...
FEISHU_SECRET=your_secret
```

## Email SMTP

### 1. Pick SMTP Provider

Common options:

- Gmail App Password
- Outlook SMTP
- SendGrid
- Mailgun
- AWS SES

### 2. Configure

Generic TLS-on-587:

```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=0
SMTP_USER=alerts@example.com
SMTP_PASS=your_password_or_app_password
EMAIL_FROM=alerts@example.com
EMAIL_TO=you@example.com
```

SSL-on-465:

```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_SECURE=1
SMTP_USER=alerts@example.com
SMTP_PASS=your_password_or_app_password
EMAIL_FROM=alerts@example.com
EMAIL_TO=you@example.com
```
