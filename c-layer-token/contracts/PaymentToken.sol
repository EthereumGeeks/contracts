pragma solidity >=0.5.0 <0.6.0;

import "./token/MintableCToken.sol";


/**
 * @title PaymentToken
 * @dev PaymentToken contract
 * @author Cyril Lapinte - <cyril@openfiz.com>
 */
contract PaymentToken is MintableCToken {

  /**
   * @dev constructor
   */
  constructor(string memory _name, string memory _symbol, IRule[] memory _rules) public
    MintableCToken(_name, _symbol, _rules)
  {} /* solhint-disable no-empty-blocks */
}
