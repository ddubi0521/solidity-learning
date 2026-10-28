# Solidity Learning

**Solidity와 Hardhat을 활용한 스마트 컨트랙트 개발 및 테스트 프로젝트**

Solidity의 기본 문법부터 ERC-20 스타일 토큰 구현, 스테이킹, 블록 보상 분배, 다중 관리자 승인 시스템까지 단계적으로 학습하는 프로젝트입니다.

## 🛠 Tech Stack

- **Solidity** — 스마트 컨트랙트 개발
- **Hardhat** — 로컬 블록체인 개발 및 테스트 환경
- **TypeScript** — 테스트 코드 작성
- **Ethers.js** — 스마트 컨트랙트 및 블록체인 상호작용
- **Mocha & Chai** — 단위 테스트 및 검증

## 📁 Project Structure

```text
solidity-learning/
├── contracts/
│   ├── MyToken.sol
│   ├── TinyBank.sol
│   ├── ManagedAccess.sol
│   └── Lock.sol
├── test/
│   ├── MyToken.ts
│   ├── TinyBank.ts
│   └── constant.ts
├── ignition/
│   └── modules/
├── hardhat.config.ts
├── package.json
└── README.md
```

## 📌 Smart Contracts

### 1. MyToken.sol

ERC-20 스타일의 기본 토큰 기능을 직접 구현한 스마트 컨트랙트입니다.

**주요 기능**
- 토큰 이름, 심볼, 소수점 자릿수 설정
- 초기 토큰 발행 (Minting)
- 토큰 전송 (`transfer`)
- 토큰 사용 승인 (`approve`)
- 승인된 제3자의 토큰 전송 (`transferFrom`)
- 잔액 및 총발행량 조회
- Manager 권한을 통한 토큰 추가 발행

### 2. TinyBank.sol

MyToken을 활용한 스테이킹 및 블록별 보상 지급 컨트랙트입니다.

**주요 기능**
- 토큰 스테이킹 (`stake`)
- 스테이킹 토큰 출금 (`withdraw`)
- 블록별 보상 계산 및 지급
- 사용자별 스테이킹 수량 관리
- 전체 스테이킹 수량 조회
- 블록당 보상률 변경
- 다중 관리자 승인 시스템

**Reward Calculation**

스테이킹 보상은 다음 공식으로 계산됩니다.

```text
Reward = Blocks × RewardPerBlock × UserStaked / TotalStaked
```

- `Blocks`: 마지막 보상 정산 이후 경과한 블록 수
- `RewardPerBlock`: 블록당 지급되는 보상
- `UserStaked`: 사용자의 스테이킹 수량
- `TotalStaked`: 전체 스테이킹 수량

### 3. ManagedAccess.sol

스마트 컨트랙트의 접근 권한을 관리하는 추상 컨트랙트입니다.

**주요 기능**
- Owner 및 Manager 관리
- `onlyOwner` 접근 제한
- `onlyManager` 접근 제한
- 상속을 통한 권한 관리 로직 재사용

## 🔐 Multi-Manager Confirmation

TinyBank에는 여러 관리자의 동의가 필요한 보상률 변경 기능을 구현했습니다.

**작동 과정**

1. Owner가 3명 이상의 Manager를 등록합니다.
2. Manager가 새로운 블록 보상률을 제안합니다.
3. 등록된 모든 Manager가 개별적으로 동의합니다.
4. `onlyAllConfirmed` modifier가 전원 동의 여부를 확인합니다.
5. 모든 Manager의 동의가 완료되면 보상률을 변경합니다.
6. 변경 후 동의 상태를 초기화합니다.

**Access Control**

| Condition | Result |
|---|---|
| Non-manager attempts an operation | `You are not a manager` |
| Not all managers confirmed | `Not all confirmed yet` |
| All managers confirmed | Reward update allowed |
| Duplicate confirmation | `Already confirmed` |

## 🧪 Testing

Hardhat, Mocha, Chai를 이용해 스마트 컨트랙트의 기능을 테스트합니다.

**테스트 항목**
- 토큰 초기 발행량 및 잔액 검증
- 토큰 전송 및 승인 기능 검증
- 잔액 부족 및 승인 수량 부족 예외 처리
- 스테이킹 및 출금 검증
- 블록별 보상 지급 검증
- 관리자 등록 및 권한 확인
- 비인가 접근 차단
- 관리자 전원 동의 검증
- 중복 동의 방지

## 🚀 Getting Started

### 1. Clone Repository

```bash
git clone <repository-url>
cd solidity-learning
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Compile Contracts

```bash
npx hardhat compile
```

### 4. Run Tests

전체 테스트 실행:

```bash
npx hardhat test
```

TinyBank 테스트만 실행:

```bash
npx hardhat test test/TinyBank.ts
```

### 5. Run Local Blockchain

```bash
npx hardhat node
```

기본 RPC 주소:

```text
http://127.0.0.1:8545
```

## 📚 Learning Objectives

- Solidity 스마트 컨트랙트 구조 이해
- 토큰 발행 및 전송 로직 구현
- `mapping`, `modifier`, `event` 활용
- `require`를 활용한 예외 처리
- 추상 컨트랙트와 상속 구조 이해
- 스마트 컨트랙트 접근 제어 구현
- 스테이킹 및 블록 보상 계산 학습
- 다중 관리자 승인 로직 구현
- Hardhat 기반 테스트 및 디버깅

## 📝 Notes

이 프로젝트는 **Solidity 및 스마트 컨트랙트 개발 학습을 위한 교육용 프로젝트**입니다.

실제 메인넷 환경에서 사용하기 위한 보안 감사는 진행되지 않았으며, 토큰 및 스테이킹 로직은 학습 목적에 맞게 구현되었습니다.

---

**Solidity Learning Project**  
*Smart Contract Development with Hardhat & TypeScript*