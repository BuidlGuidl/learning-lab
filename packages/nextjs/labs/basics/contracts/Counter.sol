pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Counter is Ownable {
  // <region id="storage" scope="member">
  uint256 public number = 42;
  // </region>

  // <region id="event" scope="member">
  event NumberChanged(uint256 newNumber);
  // </region>

  constructor() Ownable(msg.sender) {}

  // <region id="increment" scope="member">
  function increment() public {
    number += 1;
  }
  // </region>

  // <region id="setter" scope="member">
  function setNumber(uint256 newNumber) public {
    number = newNumber;
    emit NumberChanged(newNumber);
  }
  // </region>

  // <region id="reset" scope="member">
  function reset() public onlyOwner {
    number = 0;
  }
  // </region>
}
