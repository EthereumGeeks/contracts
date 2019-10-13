"user strict";

/**
 * @author Cyril Lapinte - <cyril@openfiz.com>
 */

const assertRevert = require("../helpers/assertRevert");
const BonusTokensale = artifacts.require("tokensale/BonusTokensale.sol");
const Token = artifacts.require("util/token/TokenERC20.sol");

contract("BonusTokensale", function (accounts) {
  let sale, token;
 
  const vaultERC20 = accounts[1];
  const vaultETH = accounts[2];
  const tokenPrice = 500;
  const supply = "1000000";
  const start = 4102444800;
  const end = 7258118400;
  const bonuses = [ "10" ];
  const bonusUntil = (end - start) / 2;
  const bonusMode = 0; /* BonusMode.EARLY */

  beforeEach(async function () {
    token = await Token.new("Name", "Symbol", 0, accounts[1], 1000000);
    sale = await BonusTokensale.new(
      token.address,
      vaultERC20,
      vaultETH,
      tokenPrice
    );
    await token.approve(sale.address, supply, { from: accounts[1] });
  });

  it("should have a token", async function () {
    const tokenAddress = await sale.token();
    assert.equal(tokenAddress, token.address, "token");
  });

  it("should have a vault ERC20", async function () {
    const saleVaultERC20 = await sale.vaultERC20();
    assert.equal(saleVaultERC20, vaultERC20, "vaultERC20");
  });

  it("should have a vault ETH", async function () {
    const saleVaultETH = await sale.vaultETH();
    assert.equal(saleVaultETH, vaultETH, "vaultETH");
  });

  it("should have a token price", async function () {
    const saleTokenPrice = await sale.tokenPrice();
    assert.equal(saleTokenPrice, tokenPrice, "tokenPrice");
  });

  it("should have bonus mode", async function () {
    const bonusMode = await sale.bonusMode();
    assert.equal(bonusMode, 0, "bonusMode");
  });

  it("should have bonus until", async function () {
    const bonusUntil = await sale.bonusUntil();
    assert.equal(bonusUntil, 0, "bonusUntil");
  });

  it("should have early bonus", async function () {
    const earlyBonus = await sale.earlyBonus();
    assert.equal(earlyBonus, 0, "earlyBonus");
  });

  it("should have first bonus", async function () {
    const firstBonus = await sale.firstBonus();
    assert.equal(firstBonus, 0, "firstBonus");
  });

  it("should prevent non operator to define bonuses", async function () {
    await assertRevert(
      sale.defineBonus(bonuses, bonusMode, bonusUntil, { from: accounts[2] }), "OP01");
  });

  it("should let operator to define bonuses", async function () {
    const tx = await sale.defineBonus(bonuses, bonusMode, bonusUntil);
    assert.ok(tx.receipt.status, "Status");
    assert.equal(tx.logs.length, 1);
    assert.equal(tx.logs[0].event, "BonusDefined", "event");
    assert.deepEqual(tx.logs[0].args.bonuses.map((x) => x.toString()), bonuses, "bonusesLog");
    assert.equal(tx.logs[0].args.bonusMode, bonusMode, "bonusModeLog");
    assert.equal(tx.logs[0].args.bonusUntil, bonusUntil, "bonusUntilLog");
    
    const bonusesDefined = await sale.bonuses();
    assert.deepEqual(bonusesDefined.map((i) => i.toString()), [ "10" ], "bonuses");
  });

  describe("during the sale", async function () {
    beforeEach(async function () {
      sale.updateSchedule(0, end);
    });

    it("should prevent operator to define bonuses", async function () {
      await assertRevert(
        sale.defineBonus(bonuses, bonusMode, bonusUntil), "STS01");
    });

    it("should let investor invest", async function () {
      await sale.investETH({ from: accounts[3], value: 1000001 });

      const invested = await sale.investorInvested(accounts[3]);
      assert.equal(invested.toString(), 1000000, "invested");
      
      const unspentETH = await sale.investorUnspentETH(accounts[3]);
      assert.equal(unspentETH.toString(), 1, "unspentETH");
      
      const tokens = await sale.investorTokens(accounts[3]);
      assert.equal(tokens.toString(), 2000, "tokens");
    });
  });

  describe("with bonuses", async function () {
    beforeEach(async function () {
      await sale.defineBonus(bonuses, bonusMode, bonusUntil);
    });

    it("should have bonus mode", async function () {
      const bonusMode = await sale.bonusMode();
      assert.equal(bonusMode, 0, "bonusMode");
    });

    it("should have bonus until", async function () {
      const bonusUntil = await sale.bonusUntil();
      assert.equal(bonusUntil, bonusUntil, "bonusUntil");
    });

    describe("during the sale", async function () {
      beforeEach(async function () {
        sale.updateSchedule(0, end);
      });

      it("should have early bonus", async function () {
        const earlyBonus = await sale.earlyBonus();
        assert.equal(earlyBonus, 10, "earlyBonus");
      });

      it("should have first bonus", async function () {
        const firstBonus = await sale.firstBonus();
        assert.equal(firstBonus, 10, "firstBonus");
      });

      it("should let investor invest", async function () {
        await sale.investETH({ from: accounts[3], value: 1000001 });

        const invested = await sale.investorInvested(accounts[3]);
        assert.equal(invested.toString(), 1000000, "invested");
      
        const unspentETH = await sale.investorUnspentETH(accounts[3]);
        assert.equal(unspentETH.toString(), 1, "unspentETH");
      
        const tokens = await sale.investorTokens(accounts[3]);
        assert.equal(tokens.toString(), 2200, "tokens");
      });
    });
  });
});
