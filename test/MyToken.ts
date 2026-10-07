import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const mintingAmount = 1n;
const decimals = 18n;

describe("mytoken deploy", () => {
    let myTokenC: MyToken;
    let signers: HardhatEthersSigner[];
    beforeEach("should deploy", async () => {
        signers = await hre.ethers.getSigners();
        myTokenC = await hre.ethers.deployContract("MyToken", [
            "MyToken",
            "MT",
            decimals,
            mintingAmount,
        ]);
    });

    describe("Basic state value check", () => {
        it("should return name", async () => {
            expect(await myTokenC.name()).equal("MyToken");
        });
        it("should return symbol", async () => {
            expect(await myTokenC.symbol()).equal("MT");
        });
        it("should return decimals", async () => {
            expect(await myTokenC.decimals()).equal(decimals);
        });
        it("should return 0 totalSupply", async () => {
            expect(await myTokenC.totalSupply()).equal(mintingAmount * 10n ** decimals);
        });
    });

    // 1MT = 1*10^18
    describe("Mint", () => {
        it("should return 1MT balance for signer 0", async () => {
            const signer0 = signers[0];
            expect(await myTokenC.balanceOf(signer0)).equal(mintingAmount * 10n ** decimals);
        });
    });

    describe("Transfer", () => {
        it("should have 0.5MT", async () => {
            const signer1 = signers[1];
            const tx = await myTokenC.transfer(hre.ethers.parseUnits("0.5", decimals), signer1.address);

            const receipt = await tx.wait();
            console.log(receipt?.logs);

            expect(await myTokenC.balanceOf(signer1.address)).equal(
                hre.ethers.parseUnits("0.5", decimals)
            );
        });
        it("should be reverted with insufficient balance error", async () => {
            const signer1 = signers[1];
            await expect(
                myTokenC.transfer(hre.ethers.parseUnits((mintingAmount + 1n).toString(), decimals), signer1.address)
            ).to.be.revertedWith("insufficient balance");
        });

        describe("TransferFrom", () => {
            it("should emit Approval event", async () => {
                const signer1 = signers[1];
                await expect(
                    myTokenC.approve(signer1.address, hre.ethers.parseUnits("10", decimals))
                ).to.emit(myTokenC, "Approval")
                    .withArgs(signer1.address, hre.ethers.parseUnits("10", decimals));
            });
            it("should be reverted with insufficient allowance error", async () => {
                const signer0 = signers[0];
                const signer1 = signers[1];
                await expect(
                    myTokenC.connect(signer1).transferFrom(signer0.address, signer1.address, hre.ethers.parseUnits("1", decimals))
                ).to.be.revertedWith("insufficient allowance");
            });
            it("homework2: signer1번에 의한 signer0번 자산 이동 (approve & transferFrom)", async () => {
                const signer0 = signers[0];
                const signer1 = signers[1];
                const amount = hre.ethers.parseUnits("0.5", decimals);
                
                // 1. approve: signer1에게 signer0의 자산 이동권한 부여
                await myTokenC.connect(signer0).approve(signer1.address, amount);
                
                // 2. transferFrom: signer1이 signer0의 MT토큰을 자신의 주소(signer1)에게 전송
                await myTokenC.connect(signer1).transferFrom(signer0.address, signer1.address, amount);

                // 3. balance 확인
                expect(await myTokenC.balanceOf(signer0.address)).equal(hre.ethers.parseUnits("0.5", decimals));
                expect(await myTokenC.balanceOf(signer1.address)).equal(hre.ethers.parseUnits("0.5", decimals));
            });
        });
    })
});