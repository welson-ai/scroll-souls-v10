
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
 Scroll Souls – B2B + Therapist Access Contract (ZK-ready, gas-efficient)
 -----------------------------------------------------------------------
 - Organizations register and subscribe (same as before).
 - Additional ZK-ready features:
    * Each org can set a Merkle root representing member commitments (off-chain).
    * Users submit posts with a nullifierHash + postCommitment; the contract emits an event.
    * Off-chain verifier (V0/backend) validates proofs against the org merkle root,
      then calls confirmPost to mark the nullifier as used (prevents double-use).
    * The contract itself does not verify ZK proofs (keeps gas low). This is a
      hybrid / ZK-hook approach recommended for hackathon + mainnet.
 - Events allow V0/backend to listen and resolve verification.
*/

contract ScrollSoulsAccessZK {

    // ───────────────────────────
    //   STRUCTS & STATE
    // ───────────────────────────
    struct Organization {
        bool exists;
        bool verified;            // therapist / approved partner flag
        uint256 subscriptionEnd;  // timestamp for subscription validity
        string metadataURI;       // optional: org profile or logo
        bytes32 merkleRoot;       // merkle root for member commitments (ZK)
    }

    address public owner;
    uint256 public subscriptionPrice = 0.01 ether;    // editable
    uint256 public subscriptionDuration = 30 days;    // monthly access

    mapping(address => Organization) public orgs;

    // Per-org mapping of nullifier hash => used (prevents replay after confirm)
    mapping(address => mapping(bytes32 => bool)) public usedNullifiers;

    // Optional: track confirmed posts if you want a light on-chain record
    // mapping(address => mapping(bytes32 => bool)) public confirmedPosts;

    // ───────────────────────────
    //   EVENTS FOR HOOKS (V0)
    // ───────────────────────────
    event OrganizationRegistered(address indexed org, string metadataURI);
    event SubscriptionPurchased(address indexed org, uint256 expiresAt);
    event OrganizationVerified(address indexed org, bool status);
    event SubscriptionPriceUpdated(uint256 newPrice);
    event SubscriptionDurationUpdated(uint256 newDuration);

    // ZK / membership events
    event MerkleRootUpdated(address indexed org, bytes32 merkleRoot);
    // A user submitted a post (contains postCommitment + nullifierHash). Backend should verify off-chain.
    event PostSubmitted(address indexed org, bytes32 indexed postCommitment, bytes32 indexed nullifierHash, uint256 timestamp);
    // After backend verifies the ZK proof off-chain, it (or owner) calls confirmPost to mark nullifier used.
    event PostConfirmed(address indexed org, bytes32 indexed postCommitment, bytes32 indexed nullifierHash, uint256 timestamp);
    // If backend decides to reject a post (optional)
    event PostRejected(address indexed org, bytes32 indexed postCommitment, bytes32 indexed nullifierHash, uint256 timestamp);

    // ───────────────────────────
    //   MODIFIERS
    // ───────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyExistingOrgSender() {
        require(orgs[msg.sender].exists, "Not registered");
        _;
    }

    // Allow calls on behalf of an org via address parameter for certain admin functions.
    modifier onlyExistingOrg(address org) {
        require(orgs[org].exists, "Org not registered");
        _;
    }

    // ───────────────────────────
    //   CONSTRUCTOR
    // ───────────────────────────
    constructor() {
        owner = msg.sender;
    }

    // ───────────────────────────
    //   ORGANIZATION MANAGEMENT
    // ───────────────────────────

    // Register a new organization (companies or therapists)
    function registerOrganization(string memory metadataURI) external {
        require(!orgs[msg.sender].exists, "Already registered");

        orgs[msg.sender] = Organization({
            exists: true,
            verified: false,
            subscriptionEnd: 0,
            metadataURI: metadataURI,
            merkleRoot: bytes32(0)
        });

        emit OrganizationRegistered(msg.sender, metadataURI);
    }

    // Owner verifies therapist / premium orgs
    function verifyOrganization(address org, bool status) external onlyOwner {
        require(orgs[org].exists, "Org not found");

        orgs[org].verified = status;
        emit OrganizationVerified(org, status);
    }

    // ───────────────────────────
    //   MERKLE ROOT / MEMBERSHIP (ZK hooks)
    // ───────────────────────────

    // Org sets or rotates their merkle root (managed off-chain by org)
    // This root represents the current set of valid member commitments.
    function updateMerkleRoot(bytes32 newRoot) external onlyExistingOrgSender {
        orgs[msg.sender].merkleRoot = newRoot;
        emit MerkleRootUpdated(msg.sender, newRoot);
    }

    // Owner can update merkle root for an org (optional admin action)
    function updateMerkleRootForOrg(address org, bytes32 newRoot) external onlyOwner onlyExistingOrg(org) {
        orgs[org].merkleRoot = newRoot;
        emit MerkleRootUpdated(org, newRoot);
    }

    // ───────────────────────────
    //   SUBSCRIPTION SYSTEM
    // ───────────────────────────

    function purchaseSubscription() external payable onlyExistingOrgSender {
        require(msg.value == subscriptionPrice, "Incorrect payment amount");

        // If subscription valid, extend — else set new period
        if (block.timestamp < orgs[msg.sender].subscriptionEnd) {
            orgs[msg.sender].subscriptionEnd += subscriptionDuration;
        } else {
            orgs[msg.sender].subscriptionEnd = block.timestamp + subscriptionDuration;
        }

        emit SubscriptionPurchased(msg.sender, orgs[msg.sender].subscriptionEnd);
    }

    // Check subscription (V0/Backend uses this)
    function hasActiveSubscription(address org) external view returns (bool) {
        return orgs[org].subscriptionEnd >= block.timestamp;
    }

    // Get full organization info
    function getOrganization(address org) external view returns (
        bool exists,
        bool verified,
        uint256 subscriptionEnd,
        string memory metadataURI,
        bytes32 merkleRoot
    ) {
        Organization memory o = orgs[org];
        return (o.exists, o.verified, o.subscriptionEnd, o.metadataURI, o.merkleRoot);
    }

    // ───────────────────────────
    //   POSTING WORKFLOW (ZK hooks)
    // ───────────────────────────

    /*
      submitPost:
        - Called by any user (not necessarily on-chain identity linked to org).
        - The user includes:
            * org: the organization address they're posting to
            * postCommitment: a commitment/hash of the post content (keeps content off-chain if desired)
            * nullifierHash: a nullifier hash (used to prevent double-spend once confirmed)
            * proof: bytes of the ZK proof (optional, not verified on-chain)
        - The contract only emits PostSubmitted for off-chain verification by backend.
        - Backend verifies the provided proof (using orgs[org].merkleRoot).
        - After verification, backend/owner should call confirmPost which marks the nullifier used.
    */

    function submitPost(
        address org,
        bytes32 postCommitment,
        bytes32 nullifierHash,
        bytes calldata proof // optional payload; not processed on-chain
    ) external onlyExistingOrg(org) {
        // Quick check: if nullifier has already been confirmed used, reject early
        require(!usedNullifiers[org][nullifierHash], "Nullifier already used/confirmed");

        // Emit an event for V0/backend to pick up, verify the proof, and confirm.
        // We do not store the post content on-chain; only the commitment and nullifier are emitted.
        emit PostSubmitted(org, postCommitment, nullifierHash, block.timestamp);

        // Note: we deliberately don't mark the nullifier as used here because we require off-chain verification first.
        // After backend verifies the proof, it should call confirmPost (see below).
    }

    /*
      confirmPost:
        - Called by owner (or a trusted backend/account you designate) AFTER off-chain verification.
        - Marks the nullifierHash as used to prevent replay/double-confirm.
        - Emits PostConfirmed.
        - Access control: onlyOwner currently. If you want, you can add a trustedVerifier role instead.
    */
    function confirmPost(address org, bytes32 postCommitment, bytes32 nullifierHash) external onlyOwner onlyExistingOrg(org) {
        require(!usedNullifiers[org][nullifierHash], "Nullifier already used");

        usedNullifiers[org][nullifierHash] = true;

        emit PostConfirmed(org, postCommitment, nullifierHash, block.timestamp);
    }

    /*
      rejectPost:
        - Optional: called by owner/backend to mark a submission as rejected after off-chain checks.
        - Emits PostRejected for audit/logging.
    */
    function rejectPost(address org, bytes32 postCommitment, bytes32 nullifierHash) external onlyOwner onlyExistingOrg(org) {
        emit PostRejected(org, postCommitment, nullifierHash, block.timestamp);
    }

    // View to check whether a nullifier has been used/confirmed
    function isNullifierUsed(address org, bytes32 nullifierHash) external view returns (bool) {
        return usedNullifiers[org][nullifierHash];
    }

    // ───────────────────────────
    //   ADMIN CONTROLS
    // ───────────────────────────

    function updateSubscriptionPrice(uint256 newPrice) external onlyOwner {
        subscriptionPrice = newPrice;
        emit SubscriptionPriceUpdated(newPrice);
    }

    function updateSubscriptionDuration(uint256 newDuration) external onlyOwner {
        subscriptionDuration = newDuration;
        emit SubscriptionDurationUpdated(newDuration);
    }

    // Withdraw funds
    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    // Transfer ownership
    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }
}
