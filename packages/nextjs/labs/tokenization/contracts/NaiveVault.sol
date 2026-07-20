pragma solidity ^0.8.20;

// A plain storage contract from before NFTs existed. It happily receives ETH,
// but it knows nothing about ERC-721: no onERC721Received, and no function
// that could ever send a token back out. Any NFT forced in here with _mint or
// transferFrom is stranded forever — which is exactly why _safeMint refuses
// to deliver to it.
contract NaiveVault {
  string public motto = "I hold things. Forever.";

  receive() external payable {}
}
