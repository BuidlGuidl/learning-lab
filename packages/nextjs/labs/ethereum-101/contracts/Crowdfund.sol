pragma solidity ^0.8.20;

contract Crowdfund {
  address public immutable creator;
  uint256 public immutable deadline;

  event Funded(address indexed contributor, uint256 amount);
  event Refunded(address indexed contributor, uint256 amount);

  // <focus id="state">
  // <region id="goal" scope="member">
  uint256 public constant GOAL = 10 ether;
  // </region>

  // <region id="contributions" scope="member">
  mapping(address => uint256) public contributions;
  // </region>
  // </focus>

  constructor(uint256 duration) {
    creator = msg.sender;
    deadline = block.timestamp + duration;
  }

  // <focus id="fund">
  function fund() public payable {
    require(block.timestamp < deadline, "funding closed");
    require(msg.value > 0, "send some ETH");
    // <region id="fund-body">
    contributions[msg.sender] += msg.value;
    emit Funded(msg.sender, msg.value);
    // </region>
  }
  // </focus>

  function refund() public {
    // <region id="refund">
    require(block.timestamp >= deadline, "funding still open");
    require(address(this).balance < GOAL, "goal was reached");
    uint256 amount = contributions[msg.sender];
    require(amount > 0, "nothing to refund");
    contributions[msg.sender] = 0;
    (bool ok, ) = msg.sender.call{ value: amount }("");
    require(ok, "refund failed");
    emit Refunded(msg.sender, amount);
    // </region>
  }

  function claim() public {
    require(msg.sender == creator, "only the creator");
    require(block.timestamp >= deadline, "funding still open");
    require(address(this).balance >= GOAL, "goal not reached");
    (bool ok, ) = creator.call{ value: address(this).balance }("");
    require(ok, "claim failed");
  }
}
