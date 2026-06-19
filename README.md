# Ethereum Learning Lab

Interactive, browser-based labs that teach Ethereum, the EVM, and Solidity by doing. You build real contracts, compile, deploy, and wired them with an UI. All in the browser, with an AI tutor that grades your answers and coaches you the Socratic way.

The first lab, **Ethereum 101**, takes you from "what is Ethereum" to writing, deploying, and using your own crowdfunding contract.

Built on [Scaffold-ETH 2](https://scaffoldeth.io).

## Requirements

- [Node](https://nodejs.org/en/download/) (>= v20.18.3)
- [Yarn](https://classic.yarnpkg.com/en/docs/install/) (v1 or v2+)
- [Git](https://git-scm.com/downloads)
- An [OpenRouter API key](https://openrouter.ai/keys) that powers the AI grader

## Local Setup

1. Install dependencies:

   ```
   yarn install
   ```

2. Copy the env template and fill in your [OpenRouter](https://openrouter.ai/) API key:

   ```
   cp packages/nextjs/.env.example packages/nextjs/.env.local
   ```

   Set your `OPENROUTER_API_KEY`.

3. Start the app:

   ```
   yarn start
   ```

Open [http://localhost:3000](http://localhost:3000) and pick a lab. Labs compile and deploy contracts in the browser, so you don't need to run a local chain.
