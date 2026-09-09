import { POLL_ADDRESS, SeasonPoll } from "./assets/SeasonPoll";
import { SignMessage } from "./assets/SignMessage";
import { VoteFunction } from "./assets/VoteFunction";
import { defineLab } from "~~/lib/lab/define";
import type { DeployFn, LabTests } from "~~/lib/lab/harness";

// Wallets — the follow-on lab to Ethereum 101. No contracts yet: the cards here
// use a real wallet directly, not the in-browser tevm chain, so the world boots
// empty and there is nothing to grade.
const deploy: DeployFn = async () => ({});
const tests: LabTests = {};

export const lab = defineLab({
  id: "wallets",
  title: "Wallets",
  overview: "A hands-on tour of Ethereum wallets: what they hold, how they sign, and how to keep them safe.",
  contracts: {},
  deploy,
  tests,
  chapters: [
    {
      id: "wallets-101",
      title: "Wallets 101",
      cards: [
        {
          type: "concept",
          id: "purpose-of-wallets",
          label: "CONCEPT",
          title: "Purpose of wallets",
          body: "We already introduced wallets in the previous lab, but there's some important information that needs to be said again before we dive into actually using a wallet. Remember, wallets are **self-custody systems** that have two major responsibilities.\n\n**1.** Wallets keep two **very important** pieces of information **safe**:\n\n- **Your private key**: the secret string of hex characters that proves you control an account\n\n- **Your secret recovery phrase**: A list of twelve secret words that proves you control your wallet and every account within it.\n\n**2.** Wallets are also a user-friendly way to safely use your private keys to interact with the network.\n\nYou can create as many accounts within a wallet as you like. Your **secret recovery phrase** proves that you control **all accounts** within a wallet!",
        },
        {
          type: "concept",
          id: "types-of-wallets",
          label: "CONCEPT",
          title: "Types of wallets",
          body: "There are two major types of wallets:\n\n **Cold wallets**: Specialized air-gapped hardware devices that generate and store private keys. They allow users to interact with the network without ever having their private keys touch a device that is connected to the internet. Cold wallets are the most secure option, but they are physical devices that can be lost (along with your accounts and any ETH they control) and are less convenient to use. [Ledger](https://www.ledger.com/), [Trezor](https://trezor.io/), and [Keystone](https://keyst.one/) are well-established cold wallet devices.\n\n **Hot wallets**: Software on an internet-connected device that controls private keys and gives users an easy way to interact with the network. Hot wallets are somewhat less secure but by far the most common option due to their availability (free software) and the fact that there's no separate physical device to lose. Popular cold wallets include [Metamask](https://metamask.io/), [Rainbow](https://rainbow.me/), and [Rabby](https://rabby.io/), though there are many more available.",
        },
        {
          type: "concept",
          id: "exchanges",
          label: "CONCEPT",
          title: "Exchanges",
          body: "Exchanges are web apps that allow users to buy, sell, or trade ETH for other tokens. You've probably heard of the more popular exchanges like [Coinbase](https://www.coinbase.com/), [Binance](https://www.binance.com/), or [Kraken](https://www.kraken.com/). On the surface, they have wallet-like capabilities **but** there's a very important difference!\n\nExchanges are **third-party custody systems**, much like traditional banks. They control a private key and you give the exchange permission to act on your behalf.\n\nBecause exchanges are not **self-custody systems**, they are **not** a safe place to store ETH. If an exchange is hacked or goes out of business, your ETH can be lost forever. Use exchanges for buying, selling, or trading ETH, but always use a wallet to store your ETH.\n\n[NOTE: wallets allow you to do exchange-like things with tokens. Need to add something about this.]",
        },
      ],
    },
    {
      id: "getting-a-wallet",
      title: "Getting a wallet",
      cards: [
        {
          type: "concept",
          id: "install-metamask",
          label: "CONCEPT",
          title: "Install Metamask",
          body: 'Alright, let\'s get you up and running with the popular [Metamask](https://metamask.io/) browser extension hot wallet. This guide will cover how to install [Metamask](https://metamask.io/) within [Google Chrome](https://www.google.com/chrome/). It is available for other browsers but the setup steps might look different.\n\n**1.** Go to the [Metamask Install Page](https://metamask.io/download) and click the "Chrome" button.\n\n**2.** In the Chrome webstore link that opens, click the "Add to Chrome" button then confirm in the popup.\n\n**3.** Click "Create a new wallet" in the Metamask page that automatically opened and then select "User Secret Recovery Phrase".\n\n**4.** Create a password that will unlock Metamask on your machine and keep it safe within a reputable password manager like [1Password](https://1password.com/) or [LastPass](https://www.lastpass.com/).\n\n**5.** Enable biometric login in the next popup if you desire.\n\n**6.** Metamask will then show you your **ultra important** 12 word secret recovery phrase. You must write that down and keep someplace safe but do not add it to any password manager or store it on any device. We want to minimize the risk of it being exposed by bad actors. Those 12 magic words will allow you recover your wallet on a different device in the future. **Do not lose it!** **Never share it with anyone!**\n\n**7.** Click "Continue" and complete the recovery phrase quiz. This is Metamask making sure you actually **wrote it down**.\n\n**8.** Make your data sharing and product update selections then click "Open wallet" to show the Metamask extension.\n\nNice! You now have a fresh Metamask wallet installed. The next card will walk you through some basic information.',
        },
        {
          type: "concept",
          id: "metamask-basics",
          label: "CONCEPT",
          title: "Metamask basics",
          body: '\n\nYou\'ll notice that your fresh Metamask wallet automatically created your first account. That "Account 1" in the upper left corner is a local alias, just a name to help you organize your accounts. Your account\'s public address is that long truncated hex string that begins with "0x". That\'s how your account will be identified on chain.\n\nNow let\'s see how to access important secret information about your account and wallet.\n\n**1.** Click the "Account 1" alias in the top left corner.\n\n**2.** Click the three dot (⋮) menu button to the right of the account name. Then click the "Account details" option.\n\n**3.** View your **Private Key** (the secret that **proves you control your account**) by clicking "Private keys", and entering your Metamask password.\n\n**4.** View your **Secret Recovery Phrase** (the secret that proves you **control every account in your wallet**) by clicking "Secret Recovery Phrase", answering some safety questions, and entering your Metamask password.\n\nYou\'re probably tired of hearing this, but remember: **never** share your **Private Key** or **Secret Recovery Phrase** with **ANYONE**!\n\n[you have wallet. lets take a slight detour then do some wallet stuff for real!]',
        },
      ],
    },
    {
      id: "the-sepolia-testnet",
      title: "The Sepolia testnet",
      cards: [
        {
          type: "concept",
          id: "what-is-a-testnet",
          label: "CONCEPT",
          title: "What is a testnet?",
          body: "Testnets are copies of the mainnet Ethereum network that operate **exactly** the same **except** testnet ETH has zero real-world value. You can't buy or sell testnet ETH for fiat currency.\n\nTestnets are important parts of the Ethereum ecosystem because they allow developers to build, troubleshoot, and harden smart contracts in a safe environment. A mistake in a smart contract that would be catastrophic on mainnet costs nothing when deployed on a testnet.\n\nWe'll use testnets to do real transactions with your wallet without risking valuable real ETH. Specifically, we're going to use the [Sepolia](https://ethereum.org/en/developers/docs/networks/#sepolia) testnet.",
        },
        {
          type: "concept",
          id: "faucets",
          label: "CONCEPT",
          title: "Faucets",
          body: 'Faucets are public services that grant testnet ETH at no charge. Remember, we can\'t use an exchange to buy testnet ETH because it has no value. Let\'s go get some SepoliaETH!\n\n- Go to the [Google Cloud\'s Sepolia faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia).\n\n- Make sure that "Ethereum Sepolia" is selected in the top dropdown.\n\n- Copy your account address in Metamask using the copy button to the right of your account\'s public address and paste it in the "Wallet address or ENS name" field.\n\n- Click "Get 0.05 Sepolia ETH" and wait a moment for your testnet ETH to be issued.\n\n- Confirm that your account received the Sepolia ETH in Metamask. You should see that your account now holds 0.05 SepoliaETH! [add how to see that in more detail]\n\nCool! Now that you have some SepoliaETH to play with, let\'s use it to perform your first transaction.',
        },
      ],
    },
    {
      id: "your-first-transaction",
      title: "Your first transaction",
      cards: [
        {
          type: "concept",
          id: "the-public-poll-contract",
          label: "CONCEPT",
          title: "The public poll contract",
          interactive: VoteFunction,
          body: `For your first transaction, you will be voting on your favorite season in a public poll. You will use your wallet to interact with a real smart contract running on the Sepolia testnet!\n\nIt's never a good idea to blindly interact with a smart contract before confirming that the code is doing what the authors say it does. Luckily we can use the handy [Sepolia Etherscan](https://sepolia.etherscan.io/) utility to read the code within the season poll contract.\n\n- The Season Poll contract is deployed at this address: \`${POLL_ADDRESS}\`. Copy that so we can paste it in Etherscan.\n\n- Go to [Sepolia Etherscan](https://sepolia.etherscan.io/), paste the contract's address in Etherscan's search, and submit it.\n\n- Click "Contract" and scroll down to read the real code contained in SeasonPoll.sol.\n\nYou will be interacting with the vote function when you send your transaction to cast your vote. Check out the interaction below to get a walkthrough of what the vote function actually does. Then, move on to the next card to send your first real-world transaction!`,
        },
        {
          type: "concept",
          id: "cast-your-vote",
          label: "CONCEPT",
          title: "Cast your vote",
          illustrations: [SeasonPoll],
          body: 'It\'s finally to use your wallet to make your first transaction!\n\n**1.** Connect your wallet this lab by opening your Metamask and clicking the "Connect" button in the lower right corner. Metamask will show that your wallet is connected to [this url] in the same location.\n\n**2.** Now that your wallet is connected, select your favorite season in the interface below and click "vote" to initialize your transaction. Take a look at your Metamask. There\'s a lot going on there!\n\n- The "Network fee" section shows how much gas (in SepoliaEth) you\'ll be using. That quote in fiat currency is what you\'d pay if this was on mainnet using real ETH.\n\n- You can always get a contract\'s public address in Metamask to confirm that it\'s correct and explore the contract in Etherscan. In the "Network" panel, click the truncated smart contract address next to "Interacting with". Click the copy button to the right of the greyed-out address that appears in the popup.\n\n**3.** OK now let\'s actually send your transaction to cast your vote! Click "Confirm" in Metamask to send the vote transaction and wait ~20 seconds for the Sepolia network to process it. After it\'s processed you will see the poll UI update to show that your vote is now a permanent part of the Sepolia network!',
        },
        {
          type: "concept",
          id: "see-a-revert",
          label: "CONCEPT",
          title: "See a revert",
          illustrations: [SeasonPoll],
          body: 'At this point, you\'ve successfully used Metamask to send your first real-world transaction! Now, let\'s try to cheat and send in another vote.\n\n- Go ahead and make a season selection in the poll UI, click "vote", and confirm the transaction in Metamask.\n\n- Wait for the network to process your transaction then watch as it fails. We know why it did (you can\'t vote more than once) but what if we were confused about a failure?\n\n- In Metamask, click activity and select "Network: Sepolia" below that. You\'ll now see your recently failed transaction. Click that and copy the "Transaction ID" in the popup. Paste that in [Sepolia Etherscan](https://sepolia.etherscan.io/).\n\n- Take a look at the "Status:" in Etherscan. It\'s giving that exact error message we saw in the contract for when someone tries to vote more than once!\n\n[Etherscan is your best friend]',
        },
      ],
    },
    {
      id: "summary",
      title: "Summary",
      cards: [
        {
          type: "concept",
          id: "ID",
          label: "CONCEPT",
          title: "TITLE",
          body: "BODY",
        },
      ],
    },
    // {
    //   id: "signing",
    //   title: "Signing",
    //   cards: [
    //     {
    //       type: "concept",
    //       id: "signing-without-a-chain",
    //       label: "CONCEPT",
    //       title: "Signing, without a chain",
    //       interactive: SignMessage,
    //       body: "This is a simple test of signing a message on a fake local 'chain'.",
    //     },
    //   ],
    // },
  ],
});
