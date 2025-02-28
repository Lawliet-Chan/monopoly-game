// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MonopolyGame {
    address public operator;
    IERC20 public usdt;
    uint256 public constant MIN_USDT = 3 * 10**6;
    uint256 public totalPool;

    mapping(address => uint256) public playerFunds;

    event PlayerJoined(address player, uint256 amount);
    event GameEnded(address player, uint256 payout);

    constructor(address _usdt, address _operator) {
        usdt = IERC20(_usdt);
        operator = _operator;
    }

    function joinGame(uint256 amount) external {
        require(amount >= MIN_USDT, "Minimum 3 USDT required");
        require(usdt.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        uint256 operatorShare = amount * 20 / 100;
        require(usdt.transfer(operator, operatorShare), "Operator transfer failed");

        uint256 poolShare = amount - operatorShare;
        playerFunds[msg.sender] = poolShare;
        totalPool += poolShare;

        emit PlayerJoined(msg.sender, amount);
    }

    function distribute(address[] memory players, uint256[] memory shares) external {
        require(msg.sender == operator, "Only operator can distribute");
        require(players.length == shares.length, "Invalid input");

        uint256 totalShares = 0;
        for (uint256 i = 0; i < shares.length; i++) {
            totalShares += shares[i];
        }

        for (uint256 i = 0; i < players.length; i++) {
            uint256 payout = (totalPool * shares[i]) / totalShares;
            require(usdt.transfer(players[i], payout), "Payout failed");
            emit GameEnded(players[i], payout);
        }

        totalPool = 0;
    }

    function getPoolBalance() external view returns (uint256) {
        return totalPool;
    }
}