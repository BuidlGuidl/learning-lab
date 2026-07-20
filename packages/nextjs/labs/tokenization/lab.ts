import { MintIt } from "./MintIt";
import { TradeIt } from "./TradeIt";
import { SafeMintHandshake } from "./assets/SafeMintHandshake";
import { TokenAnatomyExplorer } from "./assets/TokenAnatomyExplorer";
import {
  InheritanceDiamond,
  TokenAnatomy,
  UniqueVsFungible,
  VaultAndGallery,
  WhoCanMoveIt,
} from "./assets/illustrations";
import { contracts } from "./contracts.gen";
import { deploy } from "./deploy";
import { tests } from "./tests";
import { defineLab } from "~~/lib/lab/define";

// The tokenization lab: from "what is an NFT, actually" to building, minting,
// and trading a real ERC-721 collection. The SpeedRun tokenization gotchas
// become graded, runnable beats: _safeMint vs _mint, the inheritance diamond,
// off-chain metadata, ids starting at 1, and approvals.
export const lab = defineLab({
  id: "tokenization",
  title: "Tokenization",
  overview:
    'Takes the learner from "what is an NFT, actually" to building and using their own ERC-721 collection: unique tokens, off-chain metadata on IPFS, OpenZeppelin inheritance and the diamond problem, safe minting, and the ownership + approval rules that marketplaces run on.',
  contracts,
  deploy,
  tests,
  chapters: [
    {
      id: "digital-passport",
      title: "A passport for anything",
      cards: [
        {
          type: "concept",
          id: "what-a-token-is",
          label: "CONCEPT",
          title: "Two kinds of tokens",
          illustrations: [UniqueVsFungible],
          body: "Imagine you want your wallet to carry proof of one specific thing: a ticket, a name, a game item, or a position in a protocol. A normal balance is not enough for that. The chain needs to know which exact item it is, and who owns it.\n\nSome things are **fungible**: any 1 ETH is exactly as good as any other 1 ETH, the way one euro coin trades for another. Tokens like that are just numbers in a ledger: a balance.\n\nOther things are one specific thing. A concert ticket for seat 14B. The username you've had for years. A loan position you opened at a specific price. For those, a balance is the wrong shape. You need a **non-fungible token**: a unique id, an owner, and nothing interchangeable about it.\n\nEthereum standardized this as **ERC-721**. Each token in a collection has its own `tokenId`, its own owner, and its own story. Think of it as a **digital passport** for an item: proof of ownership that lives in your wallet, and that any app can check.\n\nThat passport is the thread for the whole lab. First we'll inspect what is actually written on it, then we'll build one, mint it safely, and move it between owners.",
        },
        {
          type: "concept",
          id: "whats-actually-on-chain",
          label: "CONCEPT",
          title: "What's actually on-chain",
          illustrations: [TokenAnatomy],
          interactive: TokenAnatomyExplorer,
          body: "Start with what the passport actually stores on-chain. It is smaller than most people expect: a token id, an owner address, and a **tokenURI** pointer.\n\nThe image, the name, and the attributes live **off-chain**, in a JSON file named by that pointer. Storing a full image on Ethereum would cost a fortune. Storing a pointer costs much less.\n\nA normal URL like `https://some-startup.com/1.json` depends on that server staying alive and honest. IPFS works differently. An IPFS address is a **content hash**, a fingerprint of the bytes themselves. Anyone can host the same file, and a quiet swap changes the hash. The pointer keeps naming the content you minted.\n\nSo the chain proves ownership, while the pointer teaches apps what the token represents. The next card opens that JSON file.",
        },
        {
          type: "concept",
          id: "metadata-marketplace-shape",
          label: "CONCEPT",
          title: "The JSON wallets expect",
          body: 'Open the pointer and you usually find a small JSON document:\n\n```json\n{\n  "name": "Buffalo #1",\n  "description": "A collectible from YourCollectible",\n  "image": "ipfs://Qm...",\n  "attributes": [\n    { "trait_type": "Animal", "value": "Buffalo" },\n    { "trait_type": "Mood", "value": "Stubborn" }\n  ]\n}\n```\n\nERC-721 standardizes the ownership and transfer rules, plus a way to ask for the URI. It does **not** enforce this JSON shape. `name`, `image`, and especially `attributes` are marketplace conventions.\n\nThat convention matters. A token can be perfectly valid ERC-721 and still look broken or traitless in a wallet if the metadata is missing, unreachable, or shaped strangely. `attributes` is how marketplaces build filters, rarity tables, and collection pages. The chain owns the token; the metadata teaches apps how to present it.\n\nBefore we write code, make sure those two layers are separate in your head: the ERC-721 record on-chain, and the metadata apps read from the pointer.',
        },
        {
          type: "question",
          id: "metadata-vs-standard",
          label: "QUESTION",
          title: "Valid token, poor display",
          question:
            'A developer says, "Our contract is ERC-721, so marketplaces are required to show our image and rarity traits." What is wrong with that claim? Be precise about what ERC-721 guarantees, what lives in metadata, and why the `attributes` array still matters.',
          rubricConcepts: [
            "ERC-721 guarantees standard ownership, transfers, approvals, events, and a tokenURI query, not marketplace display",
            "the image, name, description, and traits live off-chain in metadata reached through tokenURI",
            "marketplaces use attributes by convention; ERC-721 itself does not require them",
            "without correct reachable metadata and attributes, the NFT may still be valid but wallets or marketplaces may display it poorly or without trait filters",
          ],
          hints: [
            "Separate the protocol rule from the app convention: what does the contract have to expose, and what do marketplaces choose to read?",
            "If `ownerOf(1)` works but the JSON has no `attributes`, is the token invalid, or just less useful to apps?",
          ],
        },
        {
          type: "question",
          id: "server-shutdown",
          label: "QUESTION",
          title: "The startup shuts down",
          question:
            "An NFT's `tokenURI` points at `https://nft-startup.com/42.json`. Two years later the startup shuts its servers down.\n\nWhat still works, what breaks, and how does pointing at IPFS instead change the answer?",
          rubricConcepts: [
            "the on-chain part survives: the token id and owner are still on Ethereum and it can still be traded",
            "the metadata and image break because the URL is dead, so the token points at nothing",
            "IPFS addresses are content hashes, so anyone can keep hosting the same file and the pointer keeps working",
            "content addressing also means the file can't be silently replaced because the hash pins the exact content",
          ],
          hints: [
            "Split the NFT into its two halves first: what lives on the chain, and what the pointer points at?",
            "For the IPFS half: what does it mean that the address IS the hash of the content? Who is allowed to serve that file?",
          ],
        },
        {
          type: "concept",
          id: "what-were-building",
          label: "CONCEPT",
          title: "What we're building",
          body: "Now we can build the passport instead of only describing it.\n\nWe're going to build **YourCollectible**: a real ERC-721 collection. You'll write the parts that matter, mint tokens against your own code, and watch the contract refuse a delivery that would have stranded a token.\n\n```solidity\ncontract YourCollectible is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {\n  // a counter: you'll decide where ids start\n  // a constructor: the collection's name and symbol\n  // mintItem(): where tokens come from\n  // overrides: required by the inherited contracts\n}\n```\n\nTwo more contracts ship alongside it: a **NaiveVault** that has no idea what an NFT is, and a **FriendlyGallery** that handles NFTs properly. One of them is a trap. Your mint will be graded against both.\n\nThe first job is choosing the standard code we trust instead of hand-writing an NFT from scratch.",
        },
      ],
    },
    {
      id: "standing-on-giants",
      title: "Standing on giants",
      cards: [
        {
          type: "concept",
          id: "the-standard",
          label: "CONCEPT",
          title: "Why a standard, and why inherit it",
          body: "To make our passport useful, it has to speak the same language as wallets and marketplaces. That language is **ERC-721**.\n\nERC-721 is a standard interface: `ownerOf`, `balanceOf`, `transferFrom`, `approve`, and a few friends. Because every NFT speaks it, any wallet can hold any collection and any marketplace can trade it. Apps written years before your contract exists already know how to talk to it.\n\nNobody writes those functions from scratch. **OpenZeppelin** publishes audited implementations, and Solidity lets a contract **inherit** them:\n\n```solidity\ncontract YourCollectible is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {\n```\n\nEach parent brings something:\n\n- `ERC721`: the core ownership, transfers, and approvals\n- `ERC721Enumerable`: lets anyone list tokens by owner, so a UI can show *your* NFTs\n- `ERC721URIStorage`: stores a metadata pointer for each token\n- `Ownable`: stores a contract-level owner, useful for admin functions if you add any\n\n`owner()` from `Ownable` is not the same as `ownerOf(tokenId)` from ERC-721. In this lab `mintItem` stays public, so any address with gas can mint. The deployer owns the **contract**, but each minted token belongs to the address returned by `ownerOf`.\n\nInheritance gives us hundreds of lines of tested code. The tradeoff is that some parents define the same functions, and Solidity makes us resolve those conflicts.",
        },
        {
          type: "code",
          id: "meet-the-contract",
          label: "CODE",
          title: "Meet YourCollectible",
          file: "YourCollectible.sol",
          note: "The whole collection is this one file. The faded gaps are yours to fill over this lab: the counter, the constructor, the mint, and one of the overrides. For now, just notice how the contract inherits the parents from the previous card. The two receiver contracts, NaiveVault.sol and FriendlyGallery.sol, will matter when we start minting.",
        },
        {
          type: "code-exercise",
          id: "declare-identity",
          label: "CODE EXERCISE",
          title: "Give the collection its identity",
          region: "collection-identity",
          prompt:
            "> Hit the `</> code` button or press `c` any time to see the whole file with your lines in it.\n\nBefore tokens can exist, the collection itself needs an identity. The constructor runs once, at deploy time, and hands each parent what it needs: `ERC721` wants the collection's **name** and **symbol**, and `Ownable` wants an initial owner.\n\nWrite a constructor that names the collection `YourCollectible` with symbol `YCB`, and makes **the deployer** the owner. Who is the deployer, at deploy time? The same `msg.sender` you've been using all along. The body has nothing left to do. `{}` is fine.",
          placeholder: 'constructor() ERC721("Ticket", "TCK") Ownable(msg.sender) {}',
          hints: [
            "The shape is `constructor() Parent1(args) Parent2(args) {}`. You're passing arguments up to two of the parents.",
            "`ERC721` takes the name then the symbol, as strings. `Ownable` takes one address: whoever should start as owner.",
            "Check each parent call against the prompt: do the collection name, symbol, and initial owner all match the story?",
          ],
        },
        {
          type: "concept",
          id: "the-diamond",
          label: "CONCEPT",
          title: "The diamond problem",
          illustrations: [InheritanceDiamond],
          body: "The constructor gave the collection its identity. Now we need to handle the cost of inheriting from several parents.\n\n`ERC721` defines `_update`, and so does `ERC721Enumerable`, because it hooks every transfer to maintain its token lists. `ERC721` defines `tokenURI`, and so does `ERC721URIStorage`. Two parents, same function: which one should your contract use?\n\nThis is the classic **diamond problem**. Solidity refuses to guess. The compiler makes you resolve every conflict **explicitly**:\n\n```solidity\nfunction _update(address to, uint256 tokenId, address auth)\n  internal override(ERC721, ERC721Enumerable) returns (address)\n{\n  return super._update(to, tokenId, auth);\n}\n```\n\n`override(ERC721, ERC721Enumerable)` says that both parents define this function, and that this contract is resolving the conflict. `super` then walks the parent contracts in Solidity's defined order, so Enumerable updates its token lists and ERC721 moves the ownership. If you skip the override, the contract won't compile.",
        },
        {
          type: "question",
          id: "why-explicit-override",
          label: "QUESTION",
          title: "Why won't it just compile?",
          question:
            "Delete `override(ERC721, ERC721Enumerable)` from `_update` and the compiler rejects the whole contract. Why does Solidity force you to write that list out, instead of just picking a parent for you?",
          rubricConcepts: [
            "two parents define the same function, so the call is ambiguous",
            "the compiler wants an explicit, on-purpose resolution instead of guessing which parent wins",
            "super runs the parents in a defined order so no parent's logic is silently skipped",
            "picking one parent silently would break the other's bookkeeping (Enumerable's token lists)",
          ],
          hints: [
            "What would it mean for Enumerable's transfer-tracking if the compiler quietly chose plain ERC721's `_update`?",
            "Think of `override(A, B)` as a signature on a decision: who is the compiler making take responsibility?",
          ],
        },
        {
          type: "code-exercise",
          id: "resolve-tokenuri",
          label: "CODE EXERCISE",
          title: "Resolve tokenURI yourself",
          region: "tokenuri-override",
          prompt:
            "You have seen why the compiler asks for explicit overrides. Now settle one of those conflicts yourself.\n\nBoth `ERC721` and `ERC721URIStorage` define `tokenURI(uint256)`, the function every wallet and marketplace calls to find a token's metadata.\n\nWrite the override: `public view`, takes the `uint256 tokenId`, returns `string memory`, names **both** conflicted parents in `override(...)`, and delegates to `super.tokenURI(tokenId)` so the URIStorage logic runs.",
          placeholder:
            "function example(uint256 id) public view override(Base, OtherBase) returns (string memory) {\n  return super.example(id);\n}",
          hints: [
            "The two parents that define `tokenURI` are `ERC721` and `ERC721URIStorage`. That's the pair to list.",
            "Compare your function header to the prompt: visibility, `view`, return type, and both parent names all have to be present.",
            "Inside the function, ask which parent chain should do the real URI lookup instead of rebuilding that logic yourself.",
          ],
        },
      ],
    },
    {
      id: "minting",
      title: "Minting: where tokens come from",
      cards: [
        {
          type: "concept",
          id: "ids-start-at-one",
          label: "CONCEPT",
          title: "Why the first token is #1, not #0",
          body: 'The collection has a name, a symbol, and the inherited ERC-721 machinery. Now it needs a way to create individual passports.\n\nTokens don\'t exist until someone **mints** them, and each needs an id nobody else has. Letting callers pick their own ids invites collisions, so the contract keeps a counter and hands ids out itself, in order.\n\nOne subtlety matters: in Solidity, an uninitialized `uint256` is `0`. Every mapping slot that was never written reads as zero. So if a token with id `0` existed, "this slot is empty" and "this is token zero" would look **identical**. The convention is to increment the counter *before* using it, so the first token is `1` and zero always means *no such token*.\n\n```solidity\ntokenIdCounter++;                 // 0 -> 1 before first use\nuint256 tokenId = tokenIdCounter; // first id handed out: 1\n```',
        },
        {
          type: "code-exercise",
          id: "declare-counter",
          label: "CODE EXERCISE",
          title: "Declare the counter",
          region: "token-id-counter",
          prompt:
            'Declare the counter that will hand out ids: a `uint256` named `tokenIdCounter`, marked `public` so anyone, including the frontend and our tests, can read how many tokens exist.\n\nNo initializer needed. Solidity starts it at `0`, which is exactly what "no tokens yet" should look like.',
          placeholder: "uint256 public itemCount;",
          hints: [
            "Same shape as the placeholder. Only the name changes.",
            "`public` gives you a free getter: `tokenIdCounter()` becomes readable from outside.",
            "Check the prompt for the exact type, visibility, and variable name the tests will try to read.",
          ],
        },
        {
          type: "code-exercise",
          id: "point-at-ipfs",
          label: "CODE EXERCISE",
          title: "Point the collection at IPFS",
          region: "base-uri-body",
          prompt:
            "Each new token also needs the pointer we studied in chapter 1. When a wallet asks for a token's metadata, `tokenURI` glues two strings together: a **base URI** shared by the whole collection, and the token's own IPFS hash. `_baseURI()` supplies the first half.\n\nReturn the public IPFS gateway prefix: `https://ipfs.io/ipfs/`. A stored hash like `QmfVM...` then becomes a URL any browser can open.",
          placeholder: 'return "https://example.com/api/";',
          hints: [
            "It's a one-line `return` of a string literal.",
            "Mind the trailing slash. The token's hash is appended directly to whatever you return.",
            "Ask what prefix has to come before the CID so a browser can open the token metadata.",
          ],
        },
        {
          type: "concept",
          id: "the-stuck-nft",
          label: "CONCEPT",
          title: "The vault that eats NFTs",
          illustrations: [VaultAndGallery],
          interactive: SafeMintHandshake,
          body: "We have the id and the metadata pointer. The last minting question is delivery: who receives the new token?\n\nOpenZeppelin gives you two ways to create a token: `_mint` and `_safeMint`. The difference is one receiver check.\n\nA wallet can always move a token, because its keys can sign a later call. A **contract** can only do what its code says. Send an NFT to a contract with no NFT-handling code, like our `NaiveVault`, and the token is stuck. No function in the vault can call `transferFrom`, so the NFT sits there under an owner that cannot act.\n\n`_safeMint` prevents this with a handshake. If the receiver is a contract, it calls the receiver's `onERC721Received` and requires the **magic value** back. That proves the receiver was built to handle NFTs, like our `FriendlyGallery`. If there is no valid answer, the whole transaction **reverts**, and the token is never created.\n\n`_mint` skips that question. It is cheaper, but it can create tokens that no one can ever move again. Open the animation and feed the vault both ways before you write the mint.",
        },
        {
          type: "code-exercise",
          id: "write-the-mint",
          label: "CODE EXERCISE",
          title: "Write mintItem()",
          region: "mint-body",
          prompt:
            "Now put the minting pieces together. `mintItem(to, uri)` receives a recipient and an IPFS hash. Write the body, in order:\n\n1. increment `tokenIdCounter` *before* using it, so ids start at 1\n2. read the fresh id into a `uint256 tokenId`\n3. deliver with the **safe** mint: recipient first, then the id\n4. store the token's metadata pointer with `_setTokenURI(tokenId, uri)`\n5. `return tokenId;`\n\nThe checks for this exercise attempt a delivery into `NaiveVault.sol`, the contract with no `onERC721Received`. If you reach for the unsafe mint, that test will catch the stranded token.",
          placeholder:
            "counter++;\nuint256 id = counter;\n_safeMint(recipient, id);\n_setTokenURI(id, metadata);\nreturn id;",
          hints: [
            "The two names in scope are the parameters `to` and `uri`, and your own `tokenIdCounter`.",
            "`_safeMint(to, tokenId)` runs the receiver handshake; `_setTokenURI(tokenId, uri)` is the URIStorage half.",
            "Walk the prompt in order and check each step against the local names: first create the id, then deliver safely, then store the pointer, then return the id.",
          ],
        },
        {
          type: "question",
          id: "why-safemint",
          label: "QUESTION",
          title: "Make the case for the handshake",
          question:
            'A teammate wants to switch your `mintItem` to plain `_mint`: "it is cheaper, and `_safeMint` is just extra gas."\n\nWhat exactly can go wrong with `_mint`, to which addresses, and how does `_safeMint`\'s handshake prevent it?',
          rubricConcepts: [
            "a contract can only move tokens through its own code because it has no keys and no manual override",
            "minting to a contract without onERC721Received strands the token there permanently",
            "_safeMint calls onERC721Received on contract receivers and requires the magic value back",
            "if the check fails the whole transaction reverts, so the token is never created and nothing is lost",
          ],
          hints: [
            "Start with who can move a token at all: what does a wallet have that a contract doesn't?",
            "Then trace `_mint` to the NaiveVault: the token arrives, and then which function could ever move it out?",
          ],
        },
        {
          type: "experiment",
          id: "deploy-collection",
          label: "EXPERIMENT",
          title: "Deploy the collection",
          scenario:
            "You have filled the core of the collection. Pressing Deploy compiles your contract and puts it on a fresh EVM in this browser tab, alongside the two receiver contracts. Your constructor, counter, mint, and override all run through the checks you have earned so far.\n\nThree contracts land: **YourCollectible**, the **NaiveVault**, and the **FriendlyGallery**. You know which one is the trap.",
          sharesWorld: true,
          console: "open",
        },
        {
          type: "experiment",
          id: "feed-the-vault",
          label: "EXPERIMENT",
          title: "Mint and try to feed the vault",
          scenario:
            "Your collection is live, so make some tokens. Mint one to yourself and read back what the chain now knows: the counter, the owner, the metadata pointer.\n\nThen test the receiver rule you just coded. Try to mint straight into the `NaiveVault`. You wrote the line that decides what happens next.",
          reusesWorld: "deploy-collection",
          component: MintIt,
          console: "closed",
        },
      ],
    },
    {
      id: "ownership",
      title: "Who can move your token",
      cards: [
        {
          type: "concept",
          id: "ownership-rules",
          label: "CONCEPT",
          title: "Ownership is a rule, not a row",
          illustrations: [WhoCanMoveIt],
          body: "Minting creates the passport. Ownership rules decide who can move it after that.\n\nOn-chain ownership boils down to one call: `ownerOf(tokenId)` names the owner of that specific token, and `balanceOf(address)` counts how many an address holds. Careful with the word balance here. This balance counts *unique tokens*, not an amount like ERC-20.\n\nKeep `owner()` and `ownerOf(tokenId)` separate. `owner()` is the contract's admin address. It does not automatically own every token, and it cannot take someone else's NFT just because it deployed the collection.\n\nWhat makes token ownership real is who can change it. `transferFrom(from, to, tokenId)` moves a token **atomically**. The old owner loses it and the new one gains it in the same transaction, announced by a `Transfer` event. The contract only accepts the call from:\n\n- the **owner** of the token,\n- an address the owner **approved** for that one token: `approve(spender, tokenId)`,\n- or an **operator** the owner approved for everything: `setApprovalForAll(operator, true)`.\n\nEveryone else gets a revert. There is no admin exception path. That third form is what marketplaces run on. You approve the marketplace contract as an operator, your NFTs stay in your wallet, and at sale time the marketplace calls `transferFrom` on your behalf.",
        },
        {
          type: "question",
          id: "contract-owner-vs-token-owner",
          label: "QUESTION",
          title: "Two owners, different powers",
          question:
            "The deployer of `YourCollectible` is returned by `owner()`. Alice later mints token #1 to herself, so `ownerOf(1)` returns Alice. Can the deployer transfer token #1 to Bob without Alice's approval? Why or why not?",
          rubricConcepts: [
            "`owner()` is the Ownable contract admin address; it does not make that address the owner of every ERC-721 token",
            "`ownerOf(1)` names Alice as the token owner, so Alice controls that token's transfer rights",
            "the deployer cannot transfer Alice's token unless Alice approved the deployer or made it an operator",
            "`mintItem` being public means minting access and token transfer authority are separate ideas",
          ],
          hints: [
            "Look at the two functions in the question: which one comes from Ownable, and which one comes from ERC-721?",
            "When `transferFrom` runs, does it check the contract admin, or the token owner / approved spender / operator?",
          ],
        },
        {
          type: "experiment",
          id: "trade-it",
          label: "EXPERIMENT",
          title: "Let Bob try to take it",
          scenario:
            "Deploy a fresh world and run the ownership story with real calls. First, mint token #1 to Alice. Have Bob try to grab it with `transferFrom` without approval. The contract you built will reject him. Then have Alice `approve` him, run the **exact same call**, and watch it go through. The approval is spent by the transfer it allowed.\n\nThen do the marketplace version of the same rule: mint token #2 to Alice, have Alice approve a marketplace-style operator with `setApprovalForAll`, and let that operator move the token without ever holding it first.",
          component: TradeIt,
          console: "closed",
        },
        {
          type: "question",
          id: "marketplace-approval",
          label: "QUESTION",
          title: "The marketplace never holds your NFT",
          question:
            "You list an NFT for sale on a marketplace, and the whole time it is listed, `ownerOf` still returns **your** address. The token never left your wallet. Yet the moment someone buys it, the marketplace contract moves it to the buyer.\n\nWhat made that possible, and why is it better than a marketplace that takes custody of your NFT while it is listed?",
          rubricConcepts: [
            "setApprovalForAll made the marketplace contract an operator for your tokens",
            "approval grants the right to transfer without moving the token; custody stays with the token owner",
            "at sale time the marketplace calls transferFrom, which the contract accepts because the caller is an approved operator",
            "you keep ownership (and can delist or use the token) until the sale actually executes, and a marketplace hack can't drain tokens it doesn't hold",
          ],
          hints: [
            "You saw the one-token version in the experiment: `approve(bob, 1)`. What's the approve-everything version called?",
            "Compare the failure modes: what can happen to tokens sitting *inside* a marketplace contract that can't happen to tokens that are merely approved?",
          ],
        },
      ],
    },
    {
      id: "limits",
      title: "What a token can and can't do",
      cards: [
        {
          type: "concept",
          id: "rwa-caveat",
          label: "CONCEPT",
          title: "Tokenizing the real world",
          body: 'You have seen what ERC-721 can guarantee: ids, owners, metadata pointers, safe minting, and transfer permissions. The last step is knowing what it cannot guarantee.\n\n"Tokenization" gets pitched for everything: real estate, invoices, gold, concert tickets. Sometimes it is real. Sometimes it is just a token with a story attached. The useful question is: **does moving the token actually move the rights?**\n\nFor digital-native assets, yes. An ENS name *is* its token, so owning the token is the whole asset. A Uniswap position works the same way. The chain enforces the asset because the asset lives on the chain.\n\nFor real-world assets, the chain cannot reach the asset by itself. A token "backed by" an apartment changes nothing at the land registry when it changes hands unless an **issuer, custodian, or legal framework** commits to honoring the token as the record of ownership. That bridge is a trust relationship, and the token alone cannot provide it. Without that bridge, you do not own the apartment. You own a collectible about the apartment.\n\nSo when you evaluate a tokenization project, ask who is legally bound to treat this token as the asset. The Solidity is the easy part.',
        },
        {
          type: "code",
          id: "finished-contract",
          label: "CODE",
          title: "The finished collection",
          file: "YourCollectible.sol",
          reveal: true,
          note: "The full reveal, every learner line in place: your counter, your identity, your IPFS pointer, your safe mint, your resolved diamond. Your lines sit on top of hundreds of audited OpenZeppelin lines, forming a standard NFT collection any wallet or marketplace already knows how to talk to.",
        },
        {
          type: "summary",
          id: "what-you-shipped",
          label: "SUMMARY",
          title: "You shipped a real collection",
          body: "You built and used a real ERC-721 collection. The story started with a wallet carrying proof of one unique thing. Then you unpacked that proof: token id, owner, metadata pointer, JSON metadata, and IPFS. You built the collection with OpenZeppelin, resolved the inheritance conflicts, minted ids starting at 1, used `_safeMint` to protect receiver contracts, and tested who can move a token.\n\nA token is a digital passport. Now you know what is stored in it, who can move it, and what it cannot promise about the world outside the chain.",
        },
      ],
    },
  ],
});
