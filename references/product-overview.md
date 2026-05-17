# Ten Thousand Tokens Product Overview

## What It Is

Ten Thousand Tokens is a TokenWorks protocol on Ethereum mainnet. It creates a fixed universe of 10,000 NFTs, where each NFT is tied to one future ERC20 token. The collection is not just art; it is a launch-right primitive.

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

This event maps an NFT id to its ERC20 contract address. It is emitted during mint/deployment, not necessarily during launch.

### Launched

`Launched(uint256 indexed tokenId, address indexed token, address indexed launcher, string imageURI)`

This is the main monitoring trigger. It means the NFT was burned and its paired ERC20 was launched.

## Mechanism

1. There are 10,000 NFTs.
2. Each NFT maps to a unique ERC20 contract.
3. The collection is soulbound before the unlock/sellout conditions described by the protocol.
4. A holder launches by calling `burnAndLaunch(tokenId, name, symbol, imageURI)`.
5. The NFT is burned.
6. The ERC20 metadata is set.
7. The launcher is recorded.
8. The Uniswap V4 pool/liquidity path is initialized through the protocol's hook.
9. Fees from launched tokens are routed across protocol participants, including the launcher and unburned NFT holders.

## Why Monitoring Matters

The alpha surface is the launch event. A fresh launch reveals:

- which NFT holder burned;
- which ERC20 CA is now active;
- the token name and symbol chosen by the launcher;
- whether market data begins to appear;
- how holder distribution and liquidity evolve immediately after launch.

## Common Misread

Do not monitor only contract creation. The paired ERC20 contracts can exist before launch. The proper production trigger is the `Launched` event.
