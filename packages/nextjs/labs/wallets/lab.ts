import { SepoliaBalance } from "./assets/SepoliaBalance";
import { SignMessage } from "./assets/SignMessage";
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
          body: "We already introduced wallets in the previous lab, but there's some important information that needs to be said again before we dive into actually using a wallet. Remember, wallets are **self-custody systems** that have two major responsibilities.\n\n**1.** Wallets keep two very important pieces of information safe:\n\n- **Your private key**: the secret string of hex characters that proves you control an account\n\n- **Your seed phrase**: A list of twelve secret words that proves you control your wallet and every account within it.\n\n**2.** Wallets also allow you to safely put your private keys to work to do things on the network. [a little more here]",
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
          body: "Exchanges are web apps that allow users to buy, sell, or trade ETH for other tokens. You've probably heard of the more popular exchanges like [Coinbase](https://www.coinbase.com/), [Binance](https://www.binance.com/), or [Kraken](https://www.kraken.com/). On the surface, they have wallet-like capabilities **but** there's a very important difference!\n\nExchanges are **third-party custody systems**, much like traditional banks. They control a private key and you give the exchange permission to act on your behalf.\n\nBecause exchanges are not **self-custody systems**, they are **not** a safe place to store Eth. If an exchange is hacked or goes out of business, your ETH can be lost forever. Use exchanges for buying, selling, or trading Eth, but always store your ETH in a wallet.\n\n[NOTE: wallets allow you to do exchange-like things with tokens. Need to add something about this.]",
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
          body: 'Alright, let\'s get you up and running with the popular [Metamask](https://metamask.io/) browser extension hot wallet. This guide will cover how to install [Metamask](https://metamask.io/) within [Google Chrome](https://www.google.com/chrome/). It is available for other browsers but the setup steps might look different.\n\n**1.** Go to the [Metamask Install Page](https://metamask.io/download) and click the "Chrome" button.\n\n**2.** In the Chrome webstore link that opens, click the "Add to Chrome" button then confirm in the popup.\n\n**3.** Click "Create a new wallet" in the Metamask page that automatically opened and then select "User Secret Recovery Phrase".\n\n**4.** Create a password that will unlock Metamask on your machine and keep it safe within a reputable password manager like [add some here].\n\n**5.** Enable biometric login in the next popup if you desire.\n\n**6.** Metamask will then show you your **ultra important** 12 word secret recovery phrase. You must write that down and keep someplace safe but do not add it to any password manager or store it on any device. We want to minimize the risk of it being exposed by bad actors. Those 12 magic words will allow you recover your wallet on a different device in the future. **Do not lose it!** **Never share it with anyone!**\n\n**7.** Click "Continue" and complete the recovery phrase quiz. This is Metamask making sure you actually **wrote it down**.\n\n**8.** Make your data sharing and product update selections then click "Open wallet" to show the Metamask extension.\n\nNice! You now have a fresh Metamask wallet installed. The next card will walk you through some basic information.',
        },
        {
          type: "concept",
          id: "metamask-basics",
          label: "CONCEPT",
          title: "Metamask basics",
          body: '\n\nYou\'ll notice that your fresh Metamask wallet automatically created your first account. That "Account 1" in the upper left corner is a local alias, just a name to help you organize your accounts. Your account\'s public address is that long truncated hex string that begins with "0x". That\'s how your account will be identified on chain.\n\nNow let\'s see how to access important secret information about your account and wallet.\n\n**1.** Click the "Account 1" alias in the top left corner.\n\n**2.** Click the three dot (⋮) menu button to the right of the account name. Then click the "Account details" option.\n\nFrom within that menu you can ',
        },
        {
          type: "concept",
          id: "ID",
          label: "CONCEPT",
          title: "TITLE",
          body: "BODY",
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
          body: 'Faucets are public services that grant testnet ETH at no charge. Remember, we can\'t use an exchange to buy testnet ETH because it has no value. Let\'s go get some SepoliaETH!\n\n- Go to the [Google Cloud\'s Sepolia faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia).\n\n- Make sure that "Ethereum Sepolia" is selected in the top dropdown.\n\n- Copy your account address in Metamask using the copy button to the right of your account\'s public address and paste it in the "Wallet address or ENS name" field. [include screenshot]\n\n- Click "Get 0.05 Sepolia ETH" and wait a moment for your testnet ETH to be issued.\n\n- Confirm that your account received the Sepolia ETH in Metamask. You should see that your account now holds 0.05 SepoliaETH! [add screenshot?]\n\nCool! Now that you have some SepoliaETH to play with, let\'s use it to perform your first transaction.',
        },
      ],
    },
    {
      id: "your-first-transaction",
      title: "Your first transaction",
      cards: [
        {
          type: "concept",
          id: "the-public-poll",
          label: "CONCEPT",
          title: "The public poll",
          body: "For your first transaction you will be voting on your favorite season in a public poll. You will use your wallet to transact with a real smart contract running on the Sepolia testnet!\n\nThe poll is public by the very nature of how the network operates. Anyone will be able to see that your account's public address made the transaction to vote on your favorite season.\n\nThe polling smart contract is fairly simple. It keeps a running total of how many votes were cast for each season. It only has one rule: each account is only allowed to vote once.\n\nOk, move on to the next section to perform your first real-world transaction!",
        },
        {
          type: "concept",
          id: "cast-your-vote",
          label: "CONCEPT",
          title: "Cast your vote",
          illustrations: [SepoliaBalance],
          body: "[This card will have UI to show the connected account with sepoliaETH balance and UI for the poll contract (with smart contract address).]\n\n[It will instruct users to connect their metamask, show them that they are connected in the UI and then instruct them to cast a vote. The UI will show which vote they cast (after they do it) along with vote totals for everyone.]\n\n[It will then instruct them to make the transaction to cast a vote and point out basic security checks in metamask (like correct contract address) before signing the transaction. We can point out the gas estimates.]\n\n[Optionally: we can point out that their sepoliaEth went down due to gas.]\n\n[Optionally: we can have them try to double vote and show them what a revert looks like.]\n\n[Note: concepts might need to be split across multiple cards]",
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
