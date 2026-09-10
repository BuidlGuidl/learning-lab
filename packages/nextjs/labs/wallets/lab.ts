import { Faucet } from "./assets/Faucet";
import { MainnetAndTestnet } from "./assets/MainnetAndTestnet";
import { PublicSeasonPoll } from "./assets/PublicSeasonPoll";
import { SeasonPoll } from "./assets/SeasonPoll";
import { VoteFunction } from "./assets/VoteFunction";
import { WalletTypes } from "./assets/WalletTypes";
import { POLL_ADDRESS } from "./pollAddress";
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
          body: "We introduced wallets in the previous lab, but there's some important information that needs to be said again before we dive into actually using a wallet. Remember, wallets are **self-custody systems** that have two major responsibilities.\n\n**1.** Wallets keep two **very important** pieces of information **safe**:\n\n- **Your secret recovery phrase**: a list of twelve secret words that proves you control your wallet and every account within it. A wallet can control as many accounts as you want. The **secret recovery phrase** controls **every** account within it.\n\n- **Your private key**: the secret string of hex characters that proves you control an individual account within your wallet.\n\n**2.** Wallets are also a user-friendly way to safely interact with the network without ever exposing your **secret recovery phrase** or **private keys**.",
        },
        {
          type: "concept",
          id: "types-of-wallets",
          label: "CONCEPT",
          title: "Types of wallets",
          illustrations: [WalletTypes],
          body: "There are two major types of wallets, each with its own strengths and weaknesses:\n\n**Cold wallets**: Specialized air-gapped hardware devices that generate and store private keys. They allow users to interact with the network without ever having their private keys touch a device that is connected to the internet. Cold wallets are the most secure option, but they are physical devices that can be lost (along with your accounts and any ETH they control) and are less convenient to use. [Ledger](https://www.ledger.com/), [Trezor](https://trezor.io/), and [Keystone](https://keyst.one/) are well-established cold wallet devices.\n\n**Hot wallets**: Software on an internet-connected device that controls private keys and gives users an easy way to interact with the network. Hot wallets are somewhat less secure but by far the most common option due to their availability (free software) and the fact that there's no separate physical device to lose. Popular hot wallets include [MetaMask](https://metamask.io/), [Rainbow](https://rainbow.me/), and [Rabby](https://rabby.io/), though there are many more available.",
        },
        {
          type: "concept",
          id: "exchanges",
          label: "CONCEPT",
          title: "Exchanges",
          body: "Exchanges are web apps that allow users to buy, sell, or trade ETH for other tokens. You've probably heard of the more popular exchanges like [Coinbase](https://www.coinbase.com/), [Binance](https://www.binance.com/), or [Kraken](https://www.kraken.com/). On the surface, they have wallet-like capabilities, **but** there's a very important difference!\n\nExchanges are **third-party custody systems**, much like traditional banks. They control a private key, and you give the exchange permission to act on your behalf.\n\nBecause exchanges are not **self-custody systems**, they are **not** a safe place to store ETH. If an exchange is hacked or goes out of business, your ETH can be lost forever. Use exchanges for buying, selling, or trading ETH, but always use a wallet to store your ETH.\n\n[NOTE: wallets allow you to do exchange-like things with tokens. Need to add something about this.]",
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
          title: "Install MetaMask",
          body: 'Alright, let\'s get you up and running with the popular [MetaMask](https://metamask.io/) browser extension hot wallet. This guide will cover how to install [MetaMask](https://metamask.io/) within [Google Chrome](https://www.google.com/chrome/). It is available for other browsers but the setup steps might look different.\n\n**1.** Go to the [MetaMask Install Page](https://metamask.io/download) and click the "Chrome" button.\n\n**2.** In the Chrome Web Store link that opens, click the "Add to Chrome" button then confirm in the popup.\n\n**3.** Click "Create a new wallet" in the MetaMask page that automatically opened and then select "Use Secret Recovery Phrase".\n\n**4.** Create a password that will unlock MetaMask on your machine and keep it safe within a reputable password manager like [1Password](https://1password.com/) or [LastPass](https://www.lastpass.com/).\n\n**5.** Enable biometric login in the next popup if you desire.\n\n**6.** MetaMask will then show you your **ultra important** 12-word secret recovery phrase. You must write that down and keep it someplace safe, but do not add it to any password manager or store it on any device. We want to minimize the risk of it being exposed by bad actors. Those 12 magic words will allow you to recover your wallet on a different device in the future. **Do not lose it!** **Never share it with anyone!**\n\n**7.** Click "Continue" and complete the recovery phrase quiz. This is MetaMask making sure you actually **wrote it down**.\n\n**8.** Make your data sharing and product update selections then click "Open wallet" to show the MetaMask extension.\n\nNice! You now have a fresh MetaMask wallet installed. The next card will walk you through some basic information.',
        },
        {
          type: "concept",
          id: "metamask-basics",
          label: "CONCEPT",
          title: "MetaMask basics",
          body: 'You\'ll notice that your fresh MetaMask wallet automatically created your first account. That "Account 1" in the upper left corner is a local alias, just a name to help you organize your accounts. Your account\'s public address is that long truncated hex string that begins with "0x". That\'s how your account will be identified on chain.\n\nNow let\'s see how to access important secret information about your account and wallet.\n\n**1.** Click the "Account 1" alias in the top left corner.\n\n**2.** Click the three dot (⋮) menu button to the right of the account name. Then click the "Account details" option.\n\n**3.** View your **Private Key** (the secret that **proves you control your account**) by clicking "Private keys" and entering your MetaMask password.\n\n**4.** View your **Secret Recovery Phrase** (the secret that proves you **control every account in your wallet**) by clicking "Secret Recovery Phrase", answering some safety questions, and entering your MetaMask password.\n\nYou\'re probably tired of hearing this, but remember: **never** share your **Private Key** or **Secret Recovery Phrase** with **ANYONE**!\n\n[you have wallet. lets take a slight detour then do some wallet stuff for real!]',
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
          illustrations: [MainnetAndTestnet],
          body: "Testnets are copies of the mainnet Ethereum network that operate **exactly** the same **except** that testnet ETH has zero real-world value. You can't buy or sell testnet ETH for fiat currency.\n\nTestnets are important parts of the Ethereum ecosystem because they allow developers to build, troubleshoot, and harden smart contracts in a safe environment. A mistake in a smart contract that would be catastrophic on mainnet costs nothing when deployed on a testnet.\n\nWe'll use testnets to do real transactions with your wallet without risking valuable real ETH. Specifically, we're going to use the [Sepolia](https://ethereum.org/en/developers/docs/networks/#sepolia) testnet.",
        },
        {
          type: "concept",
          id: "configure-sepolia-in-metamask",
          label: "CONCEPT",
          title: "Configure Sepolia in MetaMask",
          body: 'MetaMask does not show the Sepolia testnet by default, but that\'s an easy fix. Follow these steps to get the Sepolia network configured in your wallet:\n\n**1.** Click the "All networks" menu button just below the "Tokens" tab.\n\n**2.** Click the "Manage networks" button at the bottom of the "Select networks" popup.\n\n**3.** Scroll down to the middle of the networks list, enable the toggle for "Show test networks", and click the back button in the top left corner of the "Manage networks" page.\n\n**4.** Now click the "All default networks" button below the "Tokens" tab again and click the "Sepolia" option (about halfway down the list).\n\nNow your MetaMask is correctly configured to interact with the Sepolia testnet!',
        },
        {
          type: "concept",
          id: "faucets",
          label: "CONCEPT",
          title: "Faucets",
          illustrations: [Faucet],
          body: 'Faucets are public services that grant testnet ETH at no charge. Remember, we can\'t use an exchange to buy testnet ETH because it has no value. Let\'s go get some SepoliaETH!\n\n**1.** Go to the [Google Cloud Sepolia Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia).\n\n**2.** Make sure that "Ethereum Sepolia" is selected in the top dropdown.\n\n**3.** Copy your account address in MetaMask using the copy button to the right of your account\'s public address and paste it in the "Wallet address or ENS name" field.\n\n**4.** Click "Get 0.05 Sepolia ETH" and wait a moment for your testnet ETH to be issued.\n\n**5.** Confirm that your account received the SepoliaETH in MetaMask. The \"Tokens\" tab list should show that your account now holds 0.05 SepoliaETH!\n\nHead to the next card to answer a question about faucet safety. Then we\'ll put your SepoliaETH to work!',
        },
        {
          type: "question",
          id: "faucet-safety",
          label: "QUESTION",
          title: "Faucet safety",
          question:
            "Faucets have to guard against bots taking advantage of their goodwill by sending numerous requests to drain their testnet ETH balance. Faucets confirm that requests come from real people in a number of ways: a Google login, an active social media account, or a requirement that the requesting account already holds a small amount of mainnet ETH.\n\nImagine you find a faucet asking for a different kind of verification. It instructs you to send it **0.1 mainnet ETH** to prove you are a human, and promises to return that ETH once it has issued your testnet ETH.\n\nShould you do it?",
          rubricConcepts: [
            "no, don't send it",
            "testnet ETH has no real value, so paying real ETH for it makes no sense",
            "nothing obliges them to send it back once they have it",
            "balances are public on chain, so a faucet can already see your mainnet ETH",
            "a real check reads your address; it never requires you to part with funds",
          ],
          hints: [
            "Weigh what you would be handing over against what you would be getting back.",
            "Look again at the last verification method in that list. If a faucet can require that you already hold mainnet ETH, what must it already be able to see?",
          ],
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
          illustrations: [PublicSeasonPoll],
          interactive: VoteFunction,
          body: `For your first transaction, you will be voting on your favorite season in a public poll. You will use your wallet to interact with a real smart contract running on the Sepolia testnet!\n\nIt's never a good idea to blindly interact with a smart contract before confirming that the code is doing what the authors say it does. Luckily, we can use the handy [Sepolia Etherscan](https://sepolia.etherscan.io/) utility to read the code within the Season Poll contract.\n\n- The Season Poll contract is deployed at this address: \`${POLL_ADDRESS}\`. Copy that so we can paste it into Etherscan.\n\n- Go to [Sepolia Etherscan](https://sepolia.etherscan.io/), paste the contract's address in Etherscan's search, and submit it.\n\n- Click "Contract" and scroll down to read the real code contained in SeasonPoll.sol.\n\nYou will be interacting with the vote function when you send your transaction to cast your vote. Check out the interaction below to get a walkthrough of what the vote function actually does. Then, move on to the next card to send your first real-world transaction!`,
        },
        {
          type: "concept",
          id: "cast-your-vote",
          label: "CONCEPT",
          title: "Cast your vote",
          illustrations: [SeasonPoll],
          body: 'It\'s finally to use your wallet to make your first transaction!\n\n**1.** Connect your wallet this lab by opening your MetaMask and clicking the "Connect" button in the lower right corner. MetaMask will show that your wallet is connected to [this url] in the same location.\n\n**2.** Now that your wallet is connected, select your favorite season in the interface below and click "vote" to initialize your transaction. Take a look at your MetaMask. There\'s a lot going on there!\n\n- The "Network fee" section shows how much gas (in SepoliaEth) you\'ll be using. That quote in fiat currency is what you\'d pay if this was on mainnet using real ETH.\n\n- You can always get a contract\'s public address in MetaMask to confirm that it\'s correct and explore the contract in Etherscan. In the "Network" panel, click the truncated smart contract address next to "Interacting with". Click the copy button to the right of the greyed-out address that appears in the popup.\n\n**3.** OK now let\'s actually send your transaction to cast your vote! Click "Confirm" in MetaMask to send the vote transaction and wait ~20 seconds for the Sepolia network to process it. After it\'s processed you will see the poll UI update to show that your vote is now a permanent part of the Sepolia network!',
        },
        {
          type: "concept",
          id: "see-a-revert",
          label: "CONCEPT",
          title: "See a revert",
          illustrations: [SeasonPoll],
          body: 'At this point, you\'ve successfully used MetaMask to send your first real-world transaction! Now, let\'s try to cheat and send in another vote.\n\n- Go ahead and make a season selection in the poll UI, click "vote", and confirm the transaction in MetaMask.\n\n- Wait for the network to process your transaction then watch as it fails. We know why it did (you can\'t vote more than once) but what if we were confused about a failure?\n\n- In MetaMask, click activity and select "Network: Sepolia" below that. You\'ll now see your recently failed transaction. Click that and copy the "Transaction ID" in the popup. Paste that in [Sepolia Etherscan](https://sepolia.etherscan.io/).\n\n- Take a look at the "Status:" in Etherscan. It\'s giving that exact error message we saw in the contract for when someone tries to vote more than once!\n\n[Etherscan is your best friend]',
        },
      ],
    },
    {
      id: "summary",
      title: "Summary",
      cards: [
        {
          type: "concept",
          id: "what-we've-learned",
          label: "CONCEPT",
          title: "What we've learned",
          body: "This lab covered quite a bit of ground.\n\n- You installed the MetaMask wallet and set it up",
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
