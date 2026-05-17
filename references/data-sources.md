# Data Sources And Limitations

## Required

### Ethereum RPC

Used for:

- contract code checks;
- `eth_getLogs` event scanning;
- ERC20 metadata calls;
- block height tracking.

Recommended providers:

- Alchemy
- Infura
- QuickNode
- Ankr
- PublicNode for testing only

Public RPCs are fine for quick checks but can rate-limit or drop large historical scans.

## Built-In Public Data

### Dexscreener

Used for:

- price;
- market cap / FDV;
- liquidity;
- 24h volume;
- pair URL.

Limitations:

- fresh launches may not be indexed immediately;
- API/network failures should not block launch detection;
- Uniswap V4 indexing can lag third-party tools.

### Etherscan V2

Used for:

- top holder list;
- top holder concentration.

Needs `ETHERSCAN_API_KEY`.

Limitations:

- token holder endpoints can lag after launch;
- API access and endpoint names may change;
- holder count may require a different paid or indexed endpoint depending on Etherscan availability.

## Alert Completeness Tiers

### Tier 1: Launch Detection

Always available with a working Ethereum RPC:

- tokenId;
- token CA;
- launcher;
- transaction hash;
- block number.

### Tier 2: Token Metadata

Usually available immediately:

- name;
- symbol;
- decimals;
- total supply.

### Tier 3: Market Data

Available when indexed:

- market cap;
- price;
- liquidity;
- volume;
- pair URL.

### Tier 4: Holder Data

Requires Etherscan or another public indexer:

- holder count;
- top holder percentages;
- cluster concentration.
