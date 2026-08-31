pragma solidity ^0.8.20;

contract VendingMachine {
  address public immutable owner;

  event Sold(address indexed buyer, uint256 stockLeft);

  // <region id="price" scope="member">
  uint256 public constant PRICE = 1 ether;
  // </region>

  // <region id="stock" scope="member">
  uint256 public stock = 5;
  // </region>

  mapping(address => uint256) public purchases;

  constructor() {
    owner = msg.sender;
  }

  function buy() public payable {
    // <region id="buy-guards">
    require(msg.value == PRICE, "wrong coin");
    require(stock > 0, "sold out");
    // </region>
    // <region id="buy-body">
    stock -= 1;
    purchases[msg.sender] += 1;
    emit Sold(msg.sender, stock);
    // </region>
  }

  function withdraw() public {
    // <region id="withdraw">
    require(msg.sender == owner, "only the owner");
    uint256 amount = address(this).balance;
    require(amount > 0, "nothing to withdraw");
    (bool ok, ) = owner.call{ value: amount }("");
    require(ok, "withdraw failed");
    // </region>
  }

  function restock(uint256 amount) public {
    require(msg.sender == owner, "only the owner");
    stock += amount;
  }
}
