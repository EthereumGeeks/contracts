pragma solidity ^0.6.0;

import "@c-layer/common/contracts/interface/IERC20.sol";


/**
 * @title WrappedERC20
 * @dev WrappedERC20
 * @author Cyril Lapinte - <cyril@openfiz.com>
 * SPDX-License-Identifier: MIT
 *
 * Error messages
 */
abstract contract IWrappedERC20 is IERC20 {

  function base() public view virtual returns (IERC20);

  function deposit(uint256 _value) public virtual returns (bool);
  function depositTo(address _to, uint256 _value) public virtual returns (bool);

  function withdraw(uint256 _value) public virtual returns (bool);
  function withdrawFrom(address _from, address _to, uint256 _value) public virtual returns (bool);

  event Deposit(address indexed _address, uint256 value);
  event Withdrawal(address indexed _address, uint256 value);
}
