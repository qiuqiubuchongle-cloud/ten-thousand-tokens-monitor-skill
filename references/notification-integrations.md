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

For a private chat:

1. Send any message to your bot.
2. Visit:

```text
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
```

3. Find `message.chat.id`.

For a group:

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

The manual enrichment path prints locally but does not send notifications. To test actual notification delivery, temporarily run a known historical `Launched` block range if available, or add a small local test wrapper that calls `notify()`.

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

### 4. Notes

The script sends a text message payload:

```json
{
  "msg_type": "text",
  "content": {
    "text": "alert text"
  }
}
```

When `FEISHU_SECRET` is present, the script signs with HMAC-SHA256 using the standard timestamp plus secret format.

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

### 3. Gmail Example

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

## Multi-Channel Setup

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

The script sends to every configured destination.
