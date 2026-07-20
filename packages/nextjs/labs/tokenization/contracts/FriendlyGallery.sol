pragma solidity ^0.8.20;

import { IERC721Receiver } from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

// A contract that declares it can handle NFTs. It implements onERC721Received
// and returns the magic value, so _safeMint's delivery check passes and the
// token can move in (and later, out) safely.
contract FriendlyGallery is IERC721Receiver {
  event ArtReceived(address operator, address from, uint256 tokenId);

  function onERC721Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes calldata
  ) external override returns (bytes4) {
    emit ArtReceived(operator, from, tokenId);
    return IERC721Receiver.onERC721Received.selector;
  }
}
