# 通知接入

监控器会向所有已配置的渠道发送短通知。只有发现新的 `Launched` 事件时才会推送；普通轮询如果没有新代币发射，会保持安静。

如果某个渠道发送失败，脚本会记录错误，其它渠道仍然会继续尝试发送。

## 默认通知模板

已被行情工具索引时：

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

尚未被行情工具索引时：

```text
TTT 新代币发射

NFT: #1234
代币: Example Token (EXAMPLE)
CA: 0x...
市值/流动性: 未索引 / 未索引

持仓: 暂无数据
交易: https://etherscan.io/tx/0x...
```

## Telegram

Telegram 是最简单的通知方式，适合个人第一时间接收信号。

### 创建 Bot

1. 打开 Telegram。
2. 搜索 `@BotFather`。
3. 发送 `/newbot`。
4. 按提示设置 bot 名字和 username。
5. 复制 bot token。

Token 通常长这样：

```text
1234567890:AAExampleToken
```

### 获取 Chat ID

私聊接收：

1. 先给你的 bot 发一句 `/start`。
2. 打开下面这个地址，把 `<YOUR_BOT_TOKEN>` 换成自己的 token：

```text
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
```

3. 找到 `message.chat.id`，这个数字就是 `TELEGRAM_CHAT_ID`。

群组接收：

1. 把 bot 拉进目标群。
2. 在群里发一句话。
3. 调用 `getUpdates`。
4. 使用返回结果里的 group chat id。群组 id 通常是负数。

### 配置

把下面两项写进 `.env`：

```bash
TELEGRAM_BOT_TOKEN=1234567890:AAExampleToken
TELEGRAM_CHAT_ID=123456789
```

如果你不想手动配置，可以直接让 Agent 帮你完成：提供 bot token、chat id 和服务器信息，Agent 会把通知配置写入服务器环境变量，并验证是否能正常发送。

### 测试

可以先测试代币信息补全，不会触发真实 Telegram 推送：

```bash
node scripts/ttt-monitor.js --enrich-token 0x74cd414b31459489Daa5981a76cfcc462C6B6623
```

真实推送只发生在扫描到 `Launched` 事件时，这样可以避免测试阶段误发无意义消息。

## Discord Webhook

Discord 适合把信号推到团队频道。

### 创建 Webhook

1. 打开 Discord 服务器。
2. 进入 Server Settings。
3. 进入 Integrations。
4. 选择 Webhooks。
5. 创建 New Webhook。
6. 选择接收通知的频道。
7. 复制 Webhook URL。

### 配置

把 Webhook URL 写进 `.env`：

```bash
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

Discord 消息有长度限制，脚本会自动截断过长内容，避免超过常见 webhook 限制。

## 飞书

飞书适合把信号推到工作群或研究群。

### 创建自定义机器人

1. 打开飞书群。
2. 进入群设置。
3. 选择机器人。
4. 添加自定义机器人。
5. 复制 webhook URL。

如果开启了签名校验，同时复制 bot secret。

### 配置

不使用签名：

```bash
FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/...
```

使用签名：

```bash
FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/...
FEISHU_SECRET=your_secret
```

## 邮箱

邮箱适合做低频备份通知，不建议作为最快的交易信号入口。

### 选择 SMTP 服务

常见选择：

- Gmail App Password
- Outlook SMTP
- SendGrid
- Mailgun
- AWS SES

### 配置

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

## 多渠道同时使用

可以同时配置 Telegram、Discord、飞书和邮箱。脚本会对每个已配置渠道分别发送同一条短通知。

如果你只想要最简单的个人信号，配置 Telegram 就够了。
