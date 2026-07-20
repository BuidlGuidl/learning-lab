// Behavioural tests per region. The key is the region id in
// contracts/YourCollectible.sol — that's the whole attribution story.
// These exact functions run in validate-labs (against the canonical contract)
// and at grade time (against the learner's fill).
import { decodeEventLog } from "viem";
import { type LabTests, type World, expect, expectEq, expectOk, expectRevert, test } from "~~/lib/lab/harness";

// decode a write's logs against the contract's own abi; undecodable logs are skipped
const decodedEvents = (logs: { topics: `0x${string}`[]; data: `0x${string}` }[] | undefined, abi: unknown[]) =>
  (logs ?? []).flatMap(log => {
    try {
      return [decodeEventLog({ abi: abi as never, topics: log.topics as never, data: log.data })];
    } catch {
      return [];
    }
  });

const ZERO = "0x0000000000000000000000000000000000000000";
const GATEWAY = "https://ipfs.io/ipfs/";
// a real CID, the same one the SpeedRun challenge mints
const CID = "QmfVMAmNM1kDEBYrC2TPzQDoCRFH6F5tE1e9Mr4FkkR5Xr";

// a view call that reverts surfaces as a thrown read — catch it so tests can
// assert reverts on views the same way expectRevert does on writes
const readReverts = async (world: World, contractKey: string, fn: string, args: unknown[]) => {
  try {
    await world.read(world.contracts[contractKey], fn, args);
    return false;
  } catch {
    return true;
  }
};

export const tests: LabTests = {
  "token-id-counter": [
    test("tokenIdCounter starts at 0 — no token exists yet", async ({ contracts, read }) => {
      const value = await read(contracts.YourCollectible, "tokenIdCounter");
      expectEq(value, 0n, "tokenIdCounter before any mint");
    }),
    test("tokenIdCounter counts every mint", async ({ contracts, read, write, accounts }) => {
      expectOk(await write(contracts.YourCollectible, "mintItem", { args: [accounts[1], CID] }), "first mint");
      expectOk(await write(contracts.YourCollectible, "mintItem", { args: [accounts[2], CID] }), "second mint");
      const value = await read(contracts.YourCollectible, "tokenIdCounter");
      expectEq(value, 2n, "tokenIdCounter after two mints");
    }),
  ],

  "collection-identity": [
    test('the collection is named "YourCollectible"', async ({ contracts, read }) => {
      const name = await read(contracts.YourCollectible, "name");
      expectEq(name, "YourCollectible", "name()");
    }),
    test('the symbol is "YCB"', async ({ contracts, read }) => {
      const symbol = await read(contracts.YourCollectible, "symbol");
      expectEq(symbol, "YCB", "symbol()");
    }),
    test("the deployer became the owner", async ({ contracts, read, accounts }) => {
      const owner = await read(contracts.YourCollectible, "owner");
      expectEq(owner, accounts[0], "owner() — Ownable(msg.sender) at deploy time");
    }),
  ],

  "base-uri-body": [
    test("tokenURI points every token at the IPFS gateway", async world => {
      const { contracts, read, write, accounts } = world;
      expectOk(await write(contracts.YourCollectible, "mintItem", { args: [accounts[1], CID] }), "mintItem");
      const uri = await read(contracts.YourCollectible, "tokenURI", [1n]);
      expectEq(uri, `${GATEWAY}${CID}`, "tokenURI(1) — the base URI plus the token's CID");
    }),
  ],

  "mint-body": [
    test("the first token id is 1 — token 0 never exists", async world => {
      const { contracts, read, write, accounts } = world;
      expectOk(await write(contracts.YourCollectible, "mintItem", { args: [accounts[1], CID] }), "mintItem");
      const owner = await read(contracts.YourCollectible, "ownerOf", [1n]);
      expectEq(owner, accounts[1], "ownerOf(1) after the first mint");
      expect(
        await readReverts(world, "YourCollectible", "ownerOf", [0n]),
        "ownerOf(0) should revert — ids start at 1 so a zero id always means 'no such token'",
      );
    }),
    test("minting updates the owner's balance and the counter", async ({ contracts, read, write, accounts }) => {
      expectOk(await write(contracts.YourCollectible, "mintItem", { args: [accounts[1], CID] }), "first mint");
      expectOk(await write(contracts.YourCollectible, "mintItem", { args: [accounts[1], CID] }), "second mint");
      expectEq(await read(contracts.YourCollectible, "balanceOf", [accounts[1]]), 2n, "balanceOf after two mints");
      expectEq(await read(contracts.YourCollectible, "tokenIdCounter"), 2n, "tokenIdCounter after two mints");
    }),
    test("each token remembers its metadata pointer", async ({ contracts, read, write, accounts }) => {
      expectOk(await write(contracts.YourCollectible, "mintItem", { args: [accounts[1], CID] }), "mintItem");
      const uri = await read(contracts.YourCollectible, "tokenURI", [1n]);
      expectEq(uri, `${GATEWAY}${CID}`, "tokenURI(1) — _setTokenURI must store the minted CID");
    }),
    test("minting emits a Transfer from the zero address", async ({ contracts, write, accounts }) => {
      const tx = await write(contracts.YourCollectible, "mintItem", { args: [accounts[1], CID] });
      expectOk(tx, "mintItem");
      const events = decodedEvents(tx.logs, contracts.YourCollectible.abi);
      const transfer = events.find(e => e.eventName === "Transfer");
      expect(!!transfer, "expected a Transfer event — a mint is a transfer from address(0)");
      const args = transfer!.args as unknown as Record<string, unknown>;
      expectEq(args["from"], ZERO, "Transfer.from — a mint comes from the zero address");
      expectEq(args["to"], accounts[1], "Transfer.to");
      expectEq(args["tokenId"], 1n, "Transfer.tokenId");
    }),
    test("delivery to a contract that can't hold NFTs is refused", async ({ contracts, read, write }) => {
      // NaiveVault has no onERC721Received. _safeMint checks the receiver and
      // reverts; a plain _mint would strand the token in the vault forever.
      const attempt = await write(contracts.YourCollectible, "mintItem", { args: [contracts.NaiveVault.address, CID] });
      expectRevert(
        attempt,
        "mintItem(NaiveVault) — did you use _safeMint? _mint skips the receiver check and strands the token",
      );
      expectEq(await read(contracts.YourCollectible, "balanceOf", [contracts.NaiveVault.address]), 0n, "vault balance");
      expectEq(
        await read(contracts.YourCollectible, "tokenIdCounter"),
        0n,
        "tokenIdCounter — the revert rolls it back",
      );
    }),
    test("delivery to a contract that implements onERC721Received succeeds", async ({ contracts, read, write }) => {
      const tx = await write(contracts.YourCollectible, "mintItem", { args: [contracts.FriendlyGallery.address, CID] });
      expectOk(tx, "mintItem(FriendlyGallery)");
      const owner = await read(contracts.YourCollectible, "ownerOf", [1n]);
      expectEq(owner, contracts.FriendlyGallery.address, "ownerOf(1) — the gallery accepted the token");
    }),
    test("the collection can list an owner's tokens", async ({ contracts, read, write, accounts }) => {
      expectOk(await write(contracts.YourCollectible, "mintItem", { args: [accounts[1], CID] }), "first mint");
      expectOk(await write(contracts.YourCollectible, "mintItem", { args: [accounts[1], CID] }), "second mint");
      expectEq(
        await read(contracts.YourCollectible, "tokenOfOwnerByIndex", [accounts[1], 0n]),
        1n,
        "tokenOfOwnerByIndex(owner, 0)",
      );
      expectEq(
        await read(contracts.YourCollectible, "tokenOfOwnerByIndex", [accounts[1], 1n]),
        2n,
        "tokenOfOwnerByIndex(owner, 1)",
      );
    }),
  ],

  "tokenuri-override": [
    test("tokenURI serves the stored pointer through the override", async ({ contracts, read, write, accounts }) => {
      expectOk(await write(contracts.YourCollectible, "mintItem", { args: [accounts[1], CID] }), "mintItem");
      const uri = await read(contracts.YourCollectible, "tokenURI", [1n]);
      expectEq(uri, `${GATEWAY}${CID}`, "tokenURI(1) — super must route through ERC721URIStorage");
    }),
    test("tokenURI refuses a token that was never minted", async world => {
      expect(
        await readReverts(world, "YourCollectible", "tokenURI", [42n]),
        "tokenURI(42) should revert — there is no token 42",
      );
    }),
  ],
};
