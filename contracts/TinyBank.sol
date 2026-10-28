pragma solidity ^0.8.28;

import {ManagedAccess} from "./ManagedAccess.sol";

interface IMyToken {
    function transfer(uint256 amount, address to) external;
    function transferFrom(address from, address to, uint256 amount) external;
    function mint(uint256 amount, address owner) external;
}

contract TinyBank is ManagedAccess {
    event Staked(address, uint256);
    event Withdraw(uint256 amount, address to);

    IMyToken public stakingToken;

    mapping(address => uint256) public lastClaimedBlock;

    uint256 defaultRewardPerBlock = 1 * 10 ** 18;
    uint256 public rewardPerBlock;

    mapping(address => uint256) public staked;
    uint256 public totalStaked;

    // 관리자 관련 변수
    address[] public managers;
    mapping(address => bool) public isManager;

    // 보상 변경 제안 및 동의 상태
    uint256 public proposedRewardPerBlock;
    bool public proposalActive;

    mapping(address => bool) public confirmed;
    uint256 public confirmedCount;

    constructor(IMyToken _stakingToken) ManagedAccess(msg.sender, msg.sender) {
        stakingToken = _stakingToken;
        rewardPerBlock = defaultRewardPerBlock;

        // 배포자를 첫 번째 관리자로 등록
        managers.push(msg.sender);
        isManager[msg.sender] = true;
    }

    // Owner가 관리자 추가
    function addManager(address _manager) external onlyOwner {
        require(!proposalActive, "Proposal is active");
        require(_manager != address(0), "Invalid a manager");
        require(!isManager[_manager], "Already a manager");

        managers.push(_manager);
        isManager[_manager] = true;
    }

    // 관리자만 보상 변경을 제안
    function proposeRewardPerBlock(uint256 _amount) external {
        require(isManager[msg.sender], "You are not a manager");
        require(!proposalActive, "Proposal is active");

        proposedRewardPerBlock = _amount;
        proposalActive = true;
        confirmedCount = 0;
    }

    // 관리자들이 각각 동의
    function confirmRewardPerBlock() external {
        require(isManager[msg.sender], "You are not a manager");
        require(proposalActive, "No active proposal");
        require(!confirmed[msg.sender], "Already confirmed");

        confirmed[msg.sender] = true;
        confirmedCount += 1;
    }

    // 모든 관리자 동의 여부 확인
    modifier onlyAllConfirmed() {
        require(isManager[msg.sender], "You are not a manager");

        require(
            proposalActive &&
            confirmedCount == managers.length,
            "Not all confirmed yet"
        );

        _;
    }

    // 관리자 전원 동의 시 보상 변경
    function setRewardPerBlock(uint256 _amount)
    external
    onlyAllConfirmed
    {
        require(
            _amount == proposedRewardPerBlock,
            "Amount does not match proposal"
        );

        rewardPerBlock = _amount;

        // 다음 제안을 위해 동의 상태 초기화
        for (uint256 i = 0; i < managers.length; i++) {
            confirmed[managers[i]] = false;
        }

        confirmedCount = 0;
        proposalActive = false;
    }

    // 스테이킹 보상 계산
    modifier updateReward(address to) {
        if (staked[to] > 0) {
            uint256 blocks = block.number - lastClaimedBlock[to];
            uint256 reward = blocks * rewardPerBlock * staked[to] / totalStaked;
            stakingToken.mint(reward, to);
        }

        lastClaimedBlock[to] = block.number;
        _;
    }

    function stake(uint256 _amount) external updateReward(msg.sender) {
        require(_amount > 0, "cannot stake 0 amount");
        stakingToken.transferFrom(msg.sender, address(this), _amount);
        staked[msg.sender] += _amount;
        totalStaked += _amount;
        emit Staked(msg.sender, _amount);
    }

    function withdraw(uint256 _amount) external updateReward(msg.sender) {
        require(staked[msg.sender] >= _amount, "insufficient staked token");
        staked[msg.sender] -= _amount;
        totalStaked -= _amount;
        stakingToken.transfer(_amount, msg.sender);
        emit Withdraw(_amount, msg.sender);
    }
}