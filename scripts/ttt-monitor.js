import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ethers } from "ethers";
import nodemailer from "nodemailer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CONFIG = {
  rpcUrl: process.env.ETH_RPC_URL || "https://ethereum-rpc.publicnode.com",
  contract: (process.env.TTT_CONTRACT || "0x26d7ad0e930b54b84c00daad077ee31ba9e2fb2e").toLowerCase(),
  stateFile: process.env.STATE_FILE || path.join(__dirname, "state.json"),
  confirmations: Number(process.env.CONFIRMATIONS || 2),
  scanChunk: Number(process.env.SCAN_CHUNK || 2000),
  lookbackBlocks: Number(process.env.LOOKBACK_BLOCKS || 5000),
  etherscanApiKey: process.env.ETHERSCAN_API_KEY || "",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID || "",
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL || "",
  feishuWebhookUrl: process.env.FEISHU_WEBHOOK_URL || "",
  feishuSecret: process.env.FEISHU_SECRET || "",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: process.env.SMTP_SECURE === "1",
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  emailFrom: process.env.EMAIL_FROM || "",
  emailTo: process.env.EMAIL_TO || "",
};

const TTT_ABI = [
  "event Launched(uint256 indexed tokenId, address indexed token, address indexed launcher, string imageURI)",
  "event TokenDeployed(uint256 indexed tokenId, address indexed token, address indexed holder)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed id)",
  "function tokenContract(uint256 tokenId) view returns (address)",
  "function totalSupply() view returns (uint256)",
  "function burnCount() view returns (uint256)",
];

const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
];

const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
const ttt = new ethers.Contract(CONFIG.contract, TTT_ABI, provider);
const iface = new ethers.Interface(TTT_ABI);

function readState() {
  if (!fs.existsSync(CONFIG.stateFile)) return {};
  return JSON.parse(fs.readFileSync(CONFIG.stateFile, "utf8"));
}

function writeState(state) {
  fs.writeFileSync(CONFIG.stateFile, JSON.stringify(state, null, 2));
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {
    once: false,
    from: null,
    to: null,
    noState: false,
    backfillDeployed: false,
    watch: false,
    enrichToken: null,
  };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--once") out.once = true;
    if (arg === "--watch") out.watch = true;
    if (arg === "--no-state") out.noState = true;
    if (arg === "--backfill-deployed") out.backfillDeployed = true;
    if (arg === "--enrich-token") out.enrichToken = args[++i];
    if (arg === "--from") out.from = Number(args[++i]);
    if (arg === "--to") out.to = Number(args[++i]);
  }
  return out;
}

async function getLogsChunked(filter, fromBlock, toBlock) {
  const logs = [];
  for (let start = fromBlock; start <= toBlock; start += CONFIG.scanChunk) {
    const end = Math.min(start + CONFIG.scanChunk - 1, toBlock);
    const chunk = await provider.getLogs({ ...filter, fromBlock: start, toBlock: end });
    logs.push(...chunk);
  }
  return logs;
}

async function safeCall(label, fn, fallback = null) {
  try {
    return await fn();
  } catch (error) {
    return fallback ?? `unavailable: ${label}: ${error.shortMessage || error.message}`;
  }
}

async function getTokenMetadata(tokenAddress) {
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  const [name, symbol, decimals, totalSupplyRaw] = await Promise.all([
    safeCall("name", () => token.name(), ""),
    safeCall("symbol", () => token.symbol(), ""),
    safeCall("decimals", () => token.decimals(), 18),
    safeCall("totalSupply", () => token.totalSupply(), 0n),
  ]);

  const totalSupply = typeof totalSupplyRaw === "bigint"
    ? Number(ethers.formatUnits(totalSupplyRaw, decimals))
    : null;

  return { name, symbol, decimals, totalSupplyRaw: String(totalSupplyRaw), totalSupply };
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function getDexscreenerMarket(tokenAddress) {
  try {
    const data = await fetchJson(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
    const pairs = (data.pairs || []).filter((pair) => pair.chainId === "ethereum");
    if (!pairs.length) return { source: "Dexscreener", indexed: false };

    pairs.sort((a, b) => Number(b.liquidity?.usd || 0) - Number(a.liquidity?.usd || 0));
    const p = pairs[0];
    return {
      source: "Dexscreener",
      indexed: true,
      pairAddress: p.pairAddress,
      dexId: p.dexId,
      priceUsd: p.priceUsd ? Number(p.priceUsd) : null,
      marketCap: p.marketCap || p.fdv || null,
      liquidityUsd: p.liquidity?.usd || null,
      volume24h: p.volume?.h24 || null,
      pairUrl: p.url,
    };
  } catch (error) {
    return { source: "Dexscreener", indexed: false, error: error.message };
  }
}

async function getEtherscanHolders(tokenAddress) {
  if (!CONFIG.etherscanApiKey) {
    return { source: "Etherscan", available: false, reason: "ETHERSCAN_API_KEY not set" };
  }

  try {
    const url = new URL("https://api.etherscan.io/v2/api");
    url.searchParams.set("chainid", "1");
    url.searchParams.set("module", "token");
    url.searchParams.set("action", "tokenholderlist");
    url.searchParams.set("contractaddress", tokenAddress);
    url.searchParams.set("page", "1");
    url.searchParams.set("offset", "20");
    url.searchParams.set("apikey", CONFIG.etherscanApiKey);
    const data = await fetchJson(url.toString());
    if (data.status !== "1" || !Array.isArray(data.result)) {
      return { source: "Etherscan", available: false, reason: data.result || data.message || "not indexed" };
    }
    return { source: "Etherscan", available: true, topHolders: data.result };
  } catch (error) {
    return { source: "Etherscan", available: false, reason: error.message };
  }
}

function computeConcentration(holders, totalSupplyRaw) {
  if (!holders?.length || !totalSupplyRaw || BigInt(totalSupplyRaw) === 0n) return null;
  const total = BigInt(totalSupplyRaw);
  const amounts = holders
    .map((h) => BigInt(h.TokenHolderQuantity || h.balance || "0"))
    .sort((a, b) => (a > b ? -1 : 1));

  const pct = (n) => {
    const sum = amounts.slice(0, n).reduce((acc, value) => acc + value, 0n);
    return Number((sum * 10000n) / total) / 100;
  };

  return { top1Pct: pct(1), top5Pct: pct(5), top10Pct: pct(10), sampledHolders: holders.length };
}

async function enrichLaunch(event) {
  const tokenAddress = event.args.token.toLowerCase();
  const [metadata, market, holders] = await Promise.all([
    getTokenMetadata(tokenAddress),
    getDexscreenerMarket(tokenAddress),
    getEtherscanHolders(tokenAddress),
  ]);

  const concentration = computeConcentration(holders.topHolders, metadata.totalSupplyRaw);
  return { ...event, tokenAddress, metadata, market, holders, concentration };
}

function formatUsd(value) {
  if (value == null || value === "") return "暂无";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function formatLaunch(item) {
  const { metadata, market, holders, concentration } = item;
  const lines = [
    "发现 Ten Thousand Tokens 发射事件",
    "",
    `NFT ID: #${item.args.tokenId.toString()}`,
    `Token: ${metadata.name || "未知"} (${metadata.symbol || "未知"})`,
    `CA: ${item.tokenAddress}`,
    `Launcher: ${item.args.launcher}`,
    `Tx: https://etherscan.io/tx/${item.transactionHash}`,
    `Block: ${item.blockNumber}`,
    "",
    `市值: ${market.indexed ? formatUsd(market.marketCap) : "暂未被 Dexscreener 索引"}`,
    `价格: ${market.priceUsd ? `$${market.priceUsd}` : "暂无"}`,
    `流动性: ${formatUsd(market.liquidityUsd)}`,
    `24h Volume: ${formatUsd(market.volume24h)}`,
    `Pair: ${market.pairUrl || "暂无"}`,
    "",
  ];

  if (holders.available && concentration) {
    lines.push(`Top1 持仓: ${concentration.top1Pct}%`);
    lines.push(`Top5 持仓: ${concentration.top5Pct}%`);
    lines.push(`Top10 持仓: ${concentration.top10Pct}%`);
    lines.push(`Holder sample: top ${concentration.sampledHolders}`);
  } else {
    lines.push(`持有人/集中度: 暂无 (${holders.reason || "indexer not available"})`);
  }

  return lines.join("\n");
}

async function notify(text) {
  console.log("\n" + text + "\n");
  const results = await Promise.allSettled([
    notifyTelegram(text),
    notifyDiscord(text),
    notifyFeishu(text),
    notifyEmail(text),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error(result.reason?.message || result.reason);
    }
  }
}

async function notifyTelegram(text) {
  if (!CONFIG.telegramBotToken || !CONFIG.telegramChatId) return;

  const url = `https://api.telegram.org/bot${CONFIG.telegramBotToken}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: CONFIG.telegramChatId,
      text,
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) throw new Error(`Telegram notify failed: ${res.status} ${await res.text()}`);
}

async function notifyDiscord(text) {
  if (!CONFIG.discordWebhookUrl) return;

  const res = await fetch(CONFIG.discordWebhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content: text.slice(0, 1900) }),
  });
  if (!res.ok) throw new Error(`Discord notify failed: ${res.status} ${await res.text()}`);
}

async function notifyFeishu(text) {
  if (!CONFIG.feishuWebhookUrl) return;

  const payload = {
    msg_type: "text",
    content: { text },
  };

  if (CONFIG.feishuSecret) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const crypto = await import("node:crypto");
    const stringToSign = `${timestamp}\n${CONFIG.feishuSecret}`;
    payload.timestamp = timestamp;
    payload.sign = crypto
      .createHmac("sha256", stringToSign)
      .update("")
      .digest("base64");
  }

  const res = await fetch(CONFIG.feishuWebhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Feishu notify failed: ${res.status} ${await res.text()}`);
}

async function notifyEmail(text) {
  if (!CONFIG.smtpHost || !CONFIG.emailTo) return;

  const transporter = nodemailer.createTransport({
    host: CONFIG.smtpHost,
    port: CONFIG.smtpPort,
    secure: CONFIG.smtpSecure,
    auth: CONFIG.smtpUser ? { user: CONFIG.smtpUser, pass: CONFIG.smtpPass } : undefined,
  });

  await transporter.sendMail({
    from: CONFIG.emailFrom || CONFIG.smtpUser,
    to: CONFIG.emailTo,
    subject: "Ten Thousand Tokens launch alert",
    text,
  });
}

async function scanEvents({ fromBlock, toBlock, eventName }) {
  const event = iface.getEvent(eventName);
  const logs = await getLogsChunked({
    address: CONFIG.contract,
    topics: [event.topicHash],
  }, fromBlock, toBlock);

  return logs.map((log) => {
    const parsed = iface.parseLog(log);
    return { ...log, name: parsed.name, args: parsed.args };
  });
}

async function main() {
  const args = parseArgs();
  if (args.enrichToken) {
    const enriched = await enrichLaunch({
      name: "ManualToken",
      args: {
        tokenId: -1n,
        token: args.enrichToken,
        launcher: ethers.ZeroAddress,
        imageURI: "",
      },
      blockNumber: 0,
      transactionHash: "manual",
    });
    console.log(JSON.stringify(enriched, (_, value) => (
      typeof value === "bigint" ? value.toString() : value
    ), 2));
    console.log("\n" + formatLaunch(enriched));
    return;
  }

  if (args.watch) {
    console.log("Watching for Launched events. Press Ctrl+C to stop.");
    ttt.on("Launched", async (tokenId, token, launcher, imageURI, event) => {
      try {
        const enriched = await enrichLaunch({
          name: "Launched",
          args: { tokenId, token, launcher, imageURI },
          blockNumber: event.log.blockNumber,
          transactionHash: event.log.transactionHash,
        });
        await notify(formatLaunch(enriched));
      } catch (error) {
        console.error("Failed to handle launch event:", error);
      }
    });
    return;
  }

  const latest = await provider.getBlockNumber();
  const safeTip = Math.max(0, latest - CONFIG.confirmations);
  const state = readState();

  const defaultFrom = state.lastCheckedBlock
    ? state.lastCheckedBlock + 1
    : Math.max(0, safeTip - CONFIG.lookbackBlocks);

  const fromBlock = args.from ?? defaultFrom;
  const toBlock = args.to ?? safeTip;
  if (fromBlock > toBlock) {
    console.log(`No new blocks. latest=${latest}, safeTip=${safeTip}, lastChecked=${state.lastCheckedBlock || "none"}`);
    return;
  }

  const code = await provider.getCode(CONFIG.contract);
  if (code === "0x") throw new Error(`No contract code at ${CONFIG.contract} on configured RPC`);

  console.log(`Scanning ${args.backfillDeployed ? "TokenDeployed" : "Launched"} events`);
  console.log(`Contract: ${CONFIG.contract}`);
  console.log(`Blocks: ${fromBlock} -> ${toBlock}`);

  const eventName = args.backfillDeployed ? "TokenDeployed" : "Launched";
  const events = await scanEvents({ fromBlock, toBlock, eventName });
  console.log(`Found ${events.length} ${eventName} event(s).`);

  if (args.backfillDeployed) {
    for (const item of events) {
      console.log(`#${item.args.tokenId.toString()} token=${item.args.token} holder=${item.args.holder} tx=${item.transactionHash}`);
    }
  } else {
    for (const event of events) {
      const enriched = await enrichLaunch(event);
      await notify(formatLaunch(enriched));
    }
  }

  if (!args.noState) {
    state.lastCheckedBlock = toBlock;
    state.updatedAt = new Date().toISOString();
    writeState(state);
    console.log(`State saved: lastCheckedBlock=${toBlock}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
