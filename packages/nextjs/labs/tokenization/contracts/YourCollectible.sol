pragma solidity ^0.8.20;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import { ERC721URIStorage } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract YourCollectible is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
  // <region id="token-id-counter" scope="member">
  uint256 public tokenIdCounter;
  // </region>

  // <region id="collection-identity" scope="member">
  constructor() ERC721("YourCollectible", "YCB") Ownable(msg.sender) {}
  // </region>

  // <focus id="base-uri">
  function _baseURI() internal pure override returns (string memory) {
    // <region id="base-uri-body">
    return "https://ipfs.io/ipfs/";
    // </region>
  }
  // </focus>

  // <focus id="mint">
  function mintItem(address to, string memory uri) public returns (uint256) {
    // <region id="mint-body">
    tokenIdCounter++;
    uint256 tokenId = tokenIdCounter;
    _safeMint(to, tokenId);
    _setTokenURI(tokenId, uri);
    return tokenId;
    // </region>
  }
  // </focus>

  // The diamond, resolved: several parents implement the same hooks, so
  // Solidity makes us name every parent in override(...) and route the call
  // through super, which walks the parents in C3-linearized order.
  // <focus id="diamond">
  function _update(
    address to,
    uint256 tokenId,
    address auth
  ) internal override(ERC721, ERC721Enumerable) returns (address) {
    return super._update(to, tokenId, auth);
  }

  function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
    super._increaseBalance(account, value);
  }

  // <region id="tokenuri-override" scope="member">
  function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
    return super.tokenURI(tokenId);
  }
  // </region>

  function supportsInterface(
    bytes4 interfaceId
  ) public view override(ERC721, ERC721Enumerable, ERC721URIStorage) returns (bool) {
    return super.supportsInterface(interfaceId);
  }
  // </focus>
}
