// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title BlackBoxRegistry
/// @notice Opt-in registry where Ritual builders declare that a contract
///         adopts BlackBox logging. The Black Box tool can read this registry
///         to discover instrumented contracts and to know which event schema
///         version to decode against.
///
/// @dev The registry is intentionally permissionless-per-contract: only the
///      declared owner of an entry can update it. It stores NO funds.
contract BlackBoxRegistry {
    struct Registration {
        address contractAddress; // the instrumented contract
        address registrar;       // who registered it (and may update it)
        bytes32 schemaVersion;   // BlackBoxLogger schema version, e.g. "v1"
        string label;            // human label, e.g. "Sigil Agent Alpha"
        string category;         // "agent" | "workflow" | "scheduler" | "other"
        uint256 registeredAt;    // block.timestamp
        bool active;
    }

    /// @dev contract address => registration
    mapping(address => Registration) private _registrations;
    address[] private _allContracts;

    event ContractRegistered(
        address indexed contractAddress,
        address indexed registrar,
        bytes32 schemaVersion,
        string label,
        string category
    );
    event ContractUpdated(address indexed contractAddress, bytes32 schemaVersion, string label, bool active);
    event ContractDeactivated(address indexed contractAddress);

    error AlreadyRegistered();
    error NotRegistered();
    error NotRegistrar();

    /// @notice Register an instrumented contract.
    /// @dev Anyone can register any address, but the registrar is recorded and
    ///      only they may update the entry afterwards. The Black Box tool shows
    ///      the registrar so users can judge trust.
    function register(
        address contractAddress,
        bytes32 schemaVersion,
        string calldata label,
        string calldata category
    ) external {
        if (_registrations[contractAddress].registeredAt != 0) revert AlreadyRegistered();

        _registrations[contractAddress] = Registration({
            contractAddress: contractAddress,
            registrar: msg.sender,
            schemaVersion: schemaVersion,
            label: label,
            category: category,
            registeredAt: block.timestamp,
            active: true
        });
        _allContracts.push(contractAddress);

        emit ContractRegistered(contractAddress, msg.sender, schemaVersion, label, category);
    }

    function update(address contractAddress, bytes32 schemaVersion, string calldata label, bool active) external {
        Registration storage reg = _registrations[contractAddress];
        if (reg.registeredAt == 0) revert NotRegistered();
        if (reg.registrar != msg.sender) revert NotRegistrar();

        reg.schemaVersion = schemaVersion;
        reg.label = label;
        reg.active = active;

        emit ContractUpdated(contractAddress, schemaVersion, label, active);
        if (!active) emit ContractDeactivated(contractAddress);
    }

    function getRegistration(address contractAddress) external view returns (Registration memory) {
        return _registrations[contractAddress];
    }

    function isRegistered(address contractAddress) external view returns (bool) {
        return _registrations[contractAddress].registeredAt != 0;
    }

    function totalRegistered() external view returns (uint256) {
        return _allContracts.length;
    }

    function contractAt(uint256 index) external view returns (address) {
        return _allContracts[index];
    }
}
