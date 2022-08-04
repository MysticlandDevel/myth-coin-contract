"use strict"

var MythCoin = artifacts.require("./MythCoin.sol");
const theBN = require("bn.js")

/**
 * MythCoin contract tests 2
 */
contract('MythCoin2', function(accounts) {
  const BIG = (v) => new theBN.BN(v)

  const owner = accounts[0];
  const admin = accounts[1];
  const vault = accounts[2];
  const minter = accounts[0];

  const user1 = accounts[4];
  const user2 = accounts[5];
  const user3 = accounts[6];
  const user4 = accounts[7];
  const user5 = accounts[8];

  let coin, OneCoinInMinunit, NoOfTokens, NoOfTokensInMinunit;

  const bnBalanceOf = async addr => await coin.balanceOf(addr);
  const bnReserveOf = async addr => await coin.reserveOf(addr);
  const bnAllowanceOf = async (owner, spender) => await coin.allowance(owner, spender);

  const balanceOf = async addr => (await coin.balanceOf(addr)).toString();
  const reserveOf = async addr => (await coin.reserveOf(addr)).toString();
  const allowanceOf = async (owner, spender) => (await coin.allowance(owner,spender)).toString();


  before(async () => {
    coin = await MythCoin.deployed();
    NoOfTokensInMinunit = await coin.totalSupply();
    OneCoinInMinunit = await coin.getOneCoin();
    NoOfTokens = NoOfTokensInMinunit.div(OneCoinInMinunit)
  });

  const clearUser = async user => {
    await coin.setReserve(user, 0, {from: admin});
    await coin.transfer(vault, await bnBalanceOf(user), {from: user});
  };

  beforeEach(async () => {
    await clearUser(user1);
    await clearUser(user2);
    await clearUser(user3);
    await clearUser(user4);
    await clearUser(user5);
  });

  it("reserve and then approve", async() => {
    assert.equal(await balanceOf(user4), "0");

    const OnePlayTimesTwoInMinunit = OneCoinInMinunit.mul(BIG(2))
    const OnePlayTimesTwoInMinunitStr = OnePlayTimesTwoInMinunit.toString()

    const OnePlayTimesOneInMinunit = OneCoinInMinunit.mul(BIG(1))
    const OnePlayTimesOneInMinunitStr = OnePlayTimesOneInMinunit.toString()

    // send 2 Play to user4 and set 1 Play reserve
    await coin.transfer(user4, OnePlayTimesTwoInMinunit, {from: vault});
    await coin.setReserve(user4, OneCoinInMinunit, {from: admin});
    assert.equal(await balanceOf(user4), OnePlayTimesTwoInMinunitStr);
    assert.equal(await reserveOf(user4), OneCoinInMinunit.toString());

    // approve 2 Play to user5
    await coin.approve(user5, OnePlayTimesTwoInMinunit, {from:user4});
    assert.equal(await allowanceOf(user4, user5), OnePlayTimesTwoInMinunitStr);

    // transfer 2 Play from user4 to user5 SHOULD NOT BE POSSIBLE
    try {
      await coin.transferFrom(user4, user5, OnePlayTimesTwoInMinunit, {from: user5});
      assert.fail();
    } catch(exception) {
      assert.isTrue(exception.message.includes("revert"));
    }

    // transfer 1 Play from user4 to user5 SHOULD BE POSSIBLE
    await coin.transferFrom(user4, user5, OnePlayTimesOneInMinunit, {from: user5});
    assert.equal(await balanceOf(user4), OnePlayTimesOneInMinunitStr);
    assert.equal(await reserveOf(user4), OnePlayTimesOneInMinunitStr); // reserve will not change
    assert.equal(await allowanceOf(user4, user5), OnePlayTimesOneInMinunitStr); // allowance will be reduced
    assert.equal(await balanceOf(user5), OnePlayTimesOneInMinunitStr);
    assert.equal(await reserveOf(user5), "0");

    // transfer .5 Play from user4 to user5 SHOULD NOT BE POSSIBLE if balance <= reserve
    const halfPlayInMinunit = OneCoinInMinunit.div(BIG(2));
    try {
      await coin.transferFrom(user4, user5, halfPlayInMinunit, {from: user5});
      assert.fail();
    } catch(exception) {
      assert.isTrue(exception.message.includes("revert"));
    }
  })

  it("only minter can call mint", async() => {
      const OnePlayTimesTenInMinunit = OneCoinInMinunit.mul(BIG(10))
      const OnePlayTimesTenInMinunitStr = OnePlayTimesTenInMinunit.toString()

      assert.equal(await balanceOf(user4), "0");

      await coin.mint(user4, OnePlayTimesTenInMinunit, {from: minter})

      const totalSupplyAfterMintStr = (await coin.totalSupply()).toString()
      assert.equal(totalSupplyAfterMintStr, OnePlayTimesTenInMinunit.add(NoOfTokensInMinunit).toString())
      assert.equal(await balanceOf(user4), OnePlayTimesTenInMinunitStr);

      try {
          await coin.mint(user4, OnePlayTimesTenInMinunit, {from: user4})
          assert.fail();
      } catch(exception) {
          assert.equal(totalSupplyAfterMintStr, OnePlayTimesTenInMinunit.add(NoOfTokensInMinunit).toString())
          assert.isTrue(exception.message.includes("revert"));
      }
  })

  it("cannot mint above the mint cap", async() => {
      const OnePlayTimes100BilInMinunit =
              OneCoinInMinunit.mul(BIG(100000000000))

      assert.equal(await balanceOf(user4), "0");


      try {
          await coin.mint(user4, OnePlayTimes100BilInMinunit, {from: minter})
          assert.fail();
      } catch(exception) {
          assert.isTrue(exception.message.includes("revert"));
      }
  })
});
