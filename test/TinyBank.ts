import hre from "hardhat";
import { expect } from "chai";
import { DECIMALS, MINTING_AMOUNT } from "./constant";
import {HardhatEthersSigner} from "@nomicfoundation/hardhat-ethers/signers";
import { MyToken, TinyBank } from "../typechain-types";

describe("TinyBank", () => {
    let signers: HardhatEthersSigner[];
    let myTokenC: MyToken;
    let tinyBankC: TinyBank;

    beforeEach(async () => {
        signers = await hre.ethers.getSigners();

        myTokenC = await hre.ethers.deployContract("MyToken", [
            "MyToken",
            "MT",
            DECIMALS,
            MINTING_AMOUNT,
        ]);
        tinyBankC = await hre.ethers.deployContract("TinyBank", [
            await myTokenC.getAddress(),
        ]);

        // TinyBank에 보상 토큰 발행 권한 부여
        await myTokenC.setManager(await tinyBankC.getAddress());

        // Manager 2, Manager 3 추가
        await tinyBankC.addManager(signers[1].address);
        await tinyBankC.addManager(signers[2].address);
    });

    describe("Initialized state check", () => {
        it("should return totalStaked 0", async () => {
            expect(await tinyBankC.totalStaked()).equal(0);
        });
        it("should return staked 0 amount of signer0", async () => {
            const signer0 = signers[0];
            expect(await tinyBankC.staked(signer0.address)).equal(0);
        });
    });

    describe("Staking", async () => {
        it("should return staked amount", async () => {
            const signer0 = signers[0];
            const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
            await  myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
            await tinyBankC.stake(stakingAmount);
            expect(await tinyBankC.staked(signer0.address)).equal(stakingAmount);
            expect(await tinyBankC.totalStaked()).equal(stakingAmount);
            expect(await myTokenC.balanceOf(tinyBankC)).equal(
                await tinyBankC.totalStaked()
            );
        });

        describe("Withdraw", () => {
            it("should return 0 staked after withdrawing total token", async () => {
                const signer0 = signers[0];
                const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
                await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
                await tinyBankC.stake(stakingAmount);
                await tinyBankC.withdraw(stakingAmount);
                expect(await tinyBankC.staked(signer0.address)).equal(0);
                expect(await tinyBankC.totalStaked()).equal(0);
            });
        });

        describe("reward", () => {
            it("should reward 1MT every blocks", async () => {
                const signer0 = signers[0];
                const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
                await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
                await tinyBankC.stake(stakingAmount);

                const BLOCKS = 5n;
                const transferAmount = hre.ethers.parseUnits("1", DECIMALS);
                for(let i = 0n; i < BLOCKS; i++) {
                    await myTokenC.transfer(transferAmount, signer0.address);
                }

                await tinyBankC.withdraw(stakingAmount);
                expect(await myTokenC.balanceOf(signer0.address)).equal(
                    hre.ethers.parseUnits((BLOCKS + MINTING_AMOUNT + 1n).toString())
                );
            });

            it("Should revert when changing rewardPerBlock by hacker", async () => {
                const hacker = signers[3];
                const rewardToChange = hre.ethers.parseUnits("10000", DECIMALS);
                await expect(
                    tinyBankC.connect(hacker).setRewardPerBlock(rewardToChange)
                ).to.be.revertedWith("You are not a manager");
            });
        });


        describe("Manager Confirmation", () => {
            it("should register 3 managers", async () => {
                expect(await tinyBankC.isManager(signers[0].address))
                    .equal(true);

                expect(await tinyBankC.isManager(signers[1].address))
                    .equal(true);

                expect(await tinyBankC.isManager(signers[2].address))
                    .equal(true);

                expect(await tinyBankC.isManager(signers[3].address))
                    .equal(false);
            });

            it("should revert when a non-manager proposes a change", async () => {
                const hacker = signers[3];
                const newReward = hre.ethers.parseUnits("5", DECIMALS);

                await expect(
                    tinyBankC.connect(hacker).proposeRewardPerBlock(newReward)
                ).to.be.revertedWith("You are not a manager");
            });

            it("should revert when a non-manager confirms", async () => {
                const hacker = signers[3];
                const newReward = hre.ethers.parseUnits("5", DECIMALS);

                await tinyBankC.proposeRewardPerBlock(newReward);

                await expect(
                    tinyBankC.connect(hacker).confirmRewardPerBlock()
                ).to.be.revertedWith("You are not a manager");
            });

            it("should revert when a non-manager changes reward", async () => {
                const hacker = signers[3];
                const newReward = hre.ethers.parseUnits("5", DECIMALS);

                await tinyBankC.proposeRewardPerBlock(newReward);

                await expect(
                    tinyBankC.connect(hacker).setRewardPerBlock(newReward)
                ).to.be.revertedWith("You are not a manager");
            });

            it("should revert when not all managers confirmed", async () => {
                const newReward = hre.ethers.parseUnits("5", DECIMALS);

                await tinyBankC.proposeRewardPerBlock(newReward);

                // Manager 1 동의
                await tinyBankC.connect(signers[0]).confirmRewardPerBlock();

                // Manager 2 동의
                await tinyBankC.connect(signers[1]).confirmRewardPerBlock();

                // Manager 3은 아직 동의하지 않음
                await expect(
                    tinyBankC.setRewardPerBlock(newReward)
                ).to.be.revertedWith("Not all confirmed yet");
            });

            it("should change reward when all managers confirmed", async () => {
                const newReward = hre.ethers.parseUnits("5", DECIMALS);

                await tinyBankC.proposeRewardPerBlock(newReward);

                await tinyBankC.connect(signers[0]).confirmRewardPerBlock();
                await tinyBankC.connect(signers[1]).confirmRewardPerBlock();
                await tinyBankC.connect(signers[2]).confirmRewardPerBlock();

                expect(await tinyBankC.confirmedCount()).equal(3n);

                await tinyBankC.setRewardPerBlock(newReward);

                expect(await tinyBankC.rewardPerBlock()).equal(newReward);
                expect(await tinyBankC.confirmedCount()).equal(0n);
                expect(await tinyBankC.proposalActive()).equal(false);
            });

            it("should revert when reward differs from the proposal", async () => {
                const proposed = hre.ethers.parseUnits("5", DECIMALS);
                const different = hre.ethers.parseUnits("10", DECIMALS);

                await tinyBankC.proposeRewardPerBlock(proposed);

                await tinyBankC.connect(signers[0]).confirmRewardPerBlock();
                await tinyBankC.connect(signers[1]).confirmRewardPerBlock();
                await tinyBankC.connect(signers[2]).confirmRewardPerBlock();

                await expect(
                    tinyBankC.setRewardPerBlock(different)
                ).to.be.revertedWith("Amount does not match proposal");
            });

            it("should prevent duplicate confirmations", async () => {
                const newReward = hre.ethers.parseUnits("5", DECIMALS);

                await tinyBankC.proposeRewardPerBlock(newReward);

                await tinyBankC.connect(signers[0]).confirmRewardPerBlock();

                await expect(
                    tinyBankC.connect(signers[0]).confirmRewardPerBlock()
                ).to.be.revertedWith("Already confirmed");
            });
        });
    });
});