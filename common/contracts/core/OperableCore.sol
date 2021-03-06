pragma solidity ^0.6.0;

import "../interface/IOperableCore.sol";
import "./OperableStorage.sol";
import "./Core.sol";


/**
 * @title OperableCore
 * @dev The Operable contract enable the restrictions of operations to a set of operators
 *
 * @author Cyril Lapinte - <cyril.lapinte@openfiz.com>
 * SPDX-License-Identifier: MIT
 *
 * Error messages
 *   OC01: Sender is not a system operator
 *   OC02: Sender is not a core operator
 *   OC03: Sender is not a proxy operator
 *   OC04: Role must not be null
 *   OC05: AllPrivileges is a reserved role
 *   OC06: AllProxies is not a valid proxy address
 *   OC07: Proxy must be valid
 *   OC08: Operator has no role
 */
contract OperableCore is IOperableCore, Core, OperableStorage {

  constructor(address[] memory _sysOperators) public {
    assignOperators(ALL_PRIVILEGES, _sysOperators);
    assignProxyOperators(ALL_PROXIES, ALL_PRIVILEGES, _sysOperators);
  }

  /**
   * @dev onlySysOp modifier
   * @dev for safety reason, core owner
   * @dev can always define roles and assign or revoke operatos
   */
  modifier onlySysOp() {
    require(msg.sender == owner || hasCorePrivilege(msg.sender, msg.sig), "OC01");
    _;
  }

  /**
   * @dev onlyCoreOp modifier
   */
  modifier onlyCoreOp() {
    require(hasCorePrivilege(msg.sender, msg.sig), "OC02");
    _;
  }

  /**
   * @dev onlyProxyOp modifier
   */
  modifier onlyProxyOp(address _proxy) {
    require(hasProxyPrivilege(msg.sender, _proxy, msg.sig), "OC03");
    _;
  }

  /**
   * @dev defineRoles
   * @param _role operator role
   * @param _privileges as 4 bytes of the method
   */
  function defineRole(bytes32 _role, bytes4[] memory _privileges)
    override public onlySysOp returns (bool)
  {
    require(_role != bytes32(0), "OC04");
    require(_role != ALL_PRIVILEGES, "OC05");

    delete roles[_role];
    for (uint256 i=0; i < _privileges.length; i++) {
      roles[_role].privileges[_privileges[i]] = true;
    }
    emit RoleDefined(_role);
    return true;
  }

  /**
   * @dev assignOperators
   * @param _role operator role. May be a role not defined yet.
   * @param _operators addresses
   */
  function assignOperators(bytes32 _role, address[] memory _operators)
    override public onlySysOp returns (bool)
  {
    require(_role != bytes32(0), "OC04");

    for (uint256 i=0; i < _operators.length; i++) {
      operators[_operators[i]].coreRole = _role;
      emit OperatorAssigned(_role, _operators[i]);
    }
    return true;
  }

  /**
   * @dev assignProxyOperators
   * @param _role operator role. May be a role not defined yet.
   * @param _operators addresses
   */
  function assignProxyOperators(
    address _proxy, bytes32 _role, address[] memory _operators)
    override public onlySysOp returns (bool)
  {
    require(_proxy == ALL_PROXIES ||
      delegates[proxyDelegateIds[_proxy]] != address(0), "OC07");
    require(_role != bytes32(0), "OC04");

    for (uint256 i=0; i < _operators.length; i++) {
      operators[_operators[i]].proxyRoles[_proxy] = _role;
      emit ProxyOperatorAssigned(_proxy, _role, _operators[i]);
    }
    return true;
  }

  /**
   * @dev revokeOperator
   * @param _operators addresses
   */
  function revokeOperators(address[] memory _operators)
    override public onlySysOp returns (bool)
  {
    for (uint256 i=0; i < _operators.length; i++) {
      OperatorData storage operator = operators[_operators[i]];
      require(operator.coreRole != bytes32(0), "OC08");
      operator.coreRole = bytes32(0);

      emit OperatorRevoked(_operators[i]);
    }
    return true;
  }

  /**
   * @dev revokeProxyOperator
   * @param _operators addresses
   */
  function revokeProxyOperators(address _proxy, address[] memory _operators)
    override public onlySysOp returns (bool)
  {
    for (uint256 i=0; i < _operators.length; i++) {
      OperatorData storage operator = operators[_operators[i]];
      require(operator.proxyRoles[_proxy] != bytes32(0), "OC08");
      operator.proxyRoles[_proxy] = bytes32(0);

      emit ProxyOperatorRevoked(_proxy, _operators[i]);
    }
    return true;
  }

  function defineProxy(address _proxy, uint256 _delegateId)
    override public onlyCoreOp returns (bool)
  {
    require(_proxy != ALL_PROXIES, "OC06");
    defineProxyInternal(_proxy, _delegateId);
    emit ProxyDefined(_proxy, _delegateId);
    return true;
  }

  function migrateProxy(address _proxy, address _newCore)
    override public onlyCoreOp returns (bool)
  {
    migrateProxyInternal(_proxy, _newCore);
    emit ProxyMigrated(_proxy, _newCore);
    return true;
  }

  function removeProxy(address _proxy)
    override public onlyCoreOp returns (bool)
  {
    removeProxyInternal(_proxy);
    emit ProxyRemoved(_proxy);
    return true;
  }
}
