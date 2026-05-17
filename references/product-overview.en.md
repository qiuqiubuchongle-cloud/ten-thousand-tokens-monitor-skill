# Ten Thousand Tokens Product Overview

## Core Function And Monitoring Logic

This monitor watches Ten Thousand Tokens on Ethereum mainnet and alerts only when a real token launch happens.

The key signal is not a webpage update and not generic contract creation. The key signal is the verified protocol event:

```solidity
event Launched(uint256 indexed tokenId, address indexed token, address indexed launcher, string imageURI);
```

When this event appears:

- `tokenId` is the NFT that moved through the burn-to-launch path.
- `token` is the launched ERC20 contract address, the CA.
- `launcher` is the wallet that launched it.
- `imageURI` is the launch metadata field emitted by the protocol.

The monitor then reads ERC20 name, symbol, and supply directly from-chain and tries to enrich market/liquidity/holder data from public indexers.

## What It Is

Ten Thousand Tokens is a TokenWorks protocol on Ethereum mainnet. It creates a fixed universe of 10,000 NFTs, where each NFT is tied to one future ERC20 token. The NFT is not just art; it is a standardized launch right.

The core idea:

- Holding an NFT means holding the right to launch one standardized ERC20.
- Burning the NFT launches its paired ERC20 through the protocol.
- Remaining unburned NFT holders share part of the fee flow from launched tokens.

## Contract

NFT / protocol contract:

`0x26d7ad0e930b54b84c00daad077ee31ba9e2fb2e`

Chain:

Ethereum mainnet, chain id `1`.

Whitepaper:

`https://www.token.works/ten-thousand-tokens-whitepaper.html`

## Important Events

### TokenDeployed

`TokenDeployed(uint256 indexed tokenId, address indexed token, address indexed holder)`

This event maps an NFT id to its ERC20 contract address. It means the token contract exists, but it does not necessarily mean the token has launched.

### Launched

`Launched(uint256 indexed tokenId, address indexed token, address indexed launcher, string imageURI)`

This is the main monitoring trigger. It means the NFT was burned through the burn-to-launch path and its paired ERC20 was launched.

## Mechanism

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

## What The Monitor Does

1. Checks that the protocol contract exists on Ethereum mainnet.
2. Scans `Launched` logs in block ranges.
3. Saves `lastCheckedBlock` to avoid duplicate alerts.
4. Parses `tokenId`, token CA, launcher, transaction hash, and block number.
5. Calls ERC20 `name()`, `symbol()`, `decimals()`, and `totalSupply()`.
6. Tries Dexscreener for market cap, price, liquidity, volume, and pair URL.
7. Optionally uses Etherscan API for top-holder concentration when configured.
8. Sends one short notification only when one or more launch events are found.

## Why Monitoring Matters

The alpha surface is the launch event. A fresh launch reveals:

- which NFT was burned;
- which ERC20 CA is now live;
- the token name and symbol chosen by the launcher;
- whether market data begins to appear;
- how liquidity and holder distribution evolve immediately after launch.

## Common Misread

Do not monitor only contract creation. In this protocol, paired ERC20 contracts can exist before launch. The reliable production trigger is the `Launched` event.
