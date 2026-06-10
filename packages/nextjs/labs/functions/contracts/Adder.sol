pragma solidity ^0.8.20;

contract Adder {
  // <region id="add-fn" scope="member">
  function add(uint256 a, uint256 b) public pure returns (uint256) {
    return a + b;
  }
  // </region>
}
