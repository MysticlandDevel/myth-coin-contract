"use strict";

var MythCoin = artifacts.require("./MythCoin.sol");
const theBN = require("bn.js")

/**
 * MythCoin contract learning test
 *   deploy in before, and no deploy between it()
 */
contract("MythCoin", (accounts) => {
  let owner = accounts[0];
  let admin = accounts[1];
  let vault = accounts[2];

  const BIG = (v) => new theBN.BN(v)

  const NOOFTOKENS = 10_000_000_000;

  const orgOwner = accounts[0];
  const orgAdmin = accounts[1];
  const orgVault = accounts[2];

  const user1 = accounts[4];
  const user2 = accounts[5];
  const user3 = accounts[6];

  const new1 = accounts[7];
  const new2 = accounts[8];
  const new3 = accounts[9];

  let NoOfTokensInMinunit, OneCoinInMinunit, NoOfTokensInCoin;
  let coin

  const balanceOf = async (addr) => (await coin.balanceOf(addr)).toString()
  const reserveOf = async (addr) => (await coin.reserveOf(addr)).toString()

  before(async () => {
    coin = await MythCoin.deployed();
    NoOfTokensInMinunit = BIG(await coin.totalSupply());
    OneCoinInMinunit = BIG(await coin.getOneCoin());
    NoOfTokensInCoin = NoOfTokensInMinunit.div(OneCoinInMinunit)
  });

  beforeEach(async () => {
    // reset users' balances and reserve
    if (orgOwner !== owner) {
      await coin.setOwner(orgOwner, {from: vault});
      owner = orgOwner;
    }
    if (orgAdmin !== admin) {
      await coin.setAdmin(orgAdmin, {from: owner});
      admin = orgAdmin;
    }
    if (orgVault !== vault) {
      await coin.setVault(orgVault, {from: owner});
      vault = orgVault;
    }
    await coin.setReserve(user1, 0, {from: admin});
    await coin.transfer(vault, await coin.balanceOf(user1), {from: user1});
    await coin.setReserve(user2, 0, {from: admin});
    await coin.transfer(vault, await coin.balanceOf(user2), {from: user2});
    await coin.setReserve(user3, 0, {from: admin});
    await coin.transfer(vault, await coin.balanceOf(user3), {from: user3});
  });

  it("coin initial values", async () => {
    // basic token functions
    assert.equal(await coin.symbol(), "COIN");
    assert.equal(await coin.name(), "TheCoin");
    assert.equal(await coin.decimals(), 9);
    assert.equal((await coin.totalSupply()).toString(), BIG(NOOFTOKENS).mul(OneCoinInMinunit).toString());
    assert.equal(await balanceOf(owner), "0");  // accounts[1]0
    assert.equal(await balanceOf(admin), "0");  // 0
    assert.equal(await balanceOf(vault), NoOfTokensInMinunit);

    // MythCoin functions
    assert.equal(await coin.getOwner(), owner);
    assert.equal(await coin.getAdmin(), admin);
    assert.equal(await coin.getVault(), vault);
  });

  it("token distribution", async () => {
    // initial balances
    assert.equal(await balanceOf(owner), "0");
    assert.equal(await balanceOf(admin), "0");
    assert.equal(await balanceOf(vault), NoOfTokensInMinunit);

    // transfer 1 token from vault to admin
    await coin.transfer(admin, OneCoinInMinunit, {from: vault});
    assert.equal(await balanceOf(admin), OneCoinInMinunit.toString());

    // transfer 0.5 token from admin to owner
    let halfPlay = OneCoinInMinunit.div(BIG(2))
    await coin.transfer(owner, halfPlay, {from: admin});
    assert.equal(await balanceOf(owner), halfPlay.toString());
    assert.equal(await balanceOf(admin), halfPlay.toString());
    assert.equal(await balanceOf(vault), (NoOfTokensInCoin.sub(BIG(1)).mul(OneCoinInMinunit).toString()));
  });

  it("marginal transfers", async () => {
    // initial balances
    assert.equal(await balanceOf(user1), "0");
    assert.equal(await balanceOf(user2), "0");
    assert((await coin.balanceOf(vault)).gt(BIG(0)));

    // transfer 1 token from user1(balance 0) to user2
    try {
      await coin.transfer(user2, OneCoinInMinunit.mul(BIG(1)), {from: user1});
      assert.fail();
    } catch (exception) {
      assert.isTrue(exception.message.includes("revert"));
    }

    // transfer 0 token from user1(balance 0) to user2
    try {
      await coin.transfer(user2, OneCoinInMinunit.mul(BIG(0)), {from: user1});
      assert.equal(await balanceOf(user1), OneCoinInMinunit.mul(BIG(0)).toString());
      assert.equal(await balanceOf(user2), OneCoinInMinunit.mul(BIG(0)).toString());
    } catch (exception) {
      assert.fail();
    }

    // transfer 0 token from vault(balance > 0) to user1
    try {
      await coin.transfer(user1, OneCoinInMinunit.mul(BIG(0)), {from: vault});
      assert.equal(await balanceOf(user1), OneCoinInMinunit.mul(BIG(0)).toString());
    } catch (exception) {
      assert.fail();
    }

    // transfer whole balance to other
    await coin.transfer(user1, OneCoinInMinunit.mul(BIG(1)), {from: vault});
    assert.equal(await balanceOf(user1), OneCoinInMinunit.mul(BIG(1)).toString());
    await coin.transfer(user2, OneCoinInMinunit.mul(BIG(1)), {from: user1});
    assert.equal(await balanceOf(user1), OneCoinInMinunit.mul(BIG(0)).toString());
    assert.equal(await balanceOf(user2), OneCoinInMinunit.mul(BIG(1)).toString());
  });

  /****************************************************************************/
  /* reserve                                                                  */
  /****************************************************************************/
  it("only admin can set reserve", async () => {
    await coin.setReserve(user1, OneCoinInMinunit, {from: admin});

    try {
      await coin.setReserve(user1, 0, {from: vault});
      assert.fail();
    } catch (exception) {
      assert.isTrue(exception.message.includes("revert"));
    }

    try {
      await coin.setReserve(user1, 0, {from: user1});
      assert.fail();
    } catch (exception) {
      assert.isTrue(exception.message.includes("revert"));
    }

    try {
      await coin.setReserve(user1, 0, {from: owner});
      assert.fail();
    } catch (exception) {
      assert.isTrue(exception.message.includes("revert"));
    }
  });

  it("reserve and reserveOf", async () => {
    await coin.setReserve(user1, 0, {from: admin}); // set 0 reserve to 0 reserve user
    await coin.transfer(user1, OneCoinInMinunit.mul(BIG(10)), {from: vault});
    await coin.setReserve(user1, OneCoinInMinunit.mul(BIG(5)), {from: admin});
    assert.equal(await reserveOf(user1), OneCoinInMinunit.mul(BIG(5)).toString());
  });

  it("transfer after setting reservation", async () => {
    // user1 = 10 Play
    await coin.transfer(user1, OneCoinInMinunit.mul(BIG(10)), {from: vault});
    assert.equal(await balanceOf(user1), OneCoinInMinunit.mul(BIG(10)).toString());

    // user1 = 10 Play with 5 Play reserve
    await coin.setReserve(user1, OneCoinInMinunit.mul(BIG(5)), {from: admin});
    assert.equal(await balanceOf(user1), OneCoinInMinunit.mul(BIG(10)).toString());

    // user1 = 9 Play with 5 Play reserve
    await coin.transfer(user2, OneCoinInMinunit.mul(BIG(1)), {from: user1});        // keeping reserved amount
    assert.equal(await balanceOf(user1), OneCoinInMinunit.mul(BIG(9)).toString());

    // user1 = 6 Play with 5 Play reserve
    await coin.transfer(user2, OneCoinInMinunit.mul(BIG(3)), {from: user1});        // keeping reserved amount
    assert.equal(await balanceOf(user1), OneCoinInMinunit.mul(BIG(6)).toString());

    try {
      let tx = await coin.transfer(user2, OneCoinInMinunit.mul(BIG(2)), {from: user1}); // violating reserved amount
      assert.equal(await balanceOf(user1), OneCoinInMinunit.mul(BIG(6)));
      assert.fail();
    } catch (exception) {
      assert.equal(await balanceOf(user1), OneCoinInMinunit.mul(BIG(6)));
      console.log(exception.message)
      assert.isTrue(exception.message.includes("revert"));
    }
  });

  /****************************************************************************/
  /* setAdmin, setOwner, setVault                                             */
  /****************************************************************************/
  it("setAdmin", async () => {
    await coin.setAdmin(new1, {from: owner});
    admin = new1;
    assert.equal(new1, await coin.getAdmin({from: owner}));

    await coin.setAdmin(new2, {from: vault});
    admin = new2;
    assert.equal(new2, await coin.getAdmin({from: vault}));

    try {
      await coin.setAdmin(new3, {from: admin});
      assert.fail();    // only owner or vault can set admin
    } catch (exception) {
      assert.isTrue(exception.message.includes("revert"));
    }
  });

  it("setOwner", async () => {
    // only vault can set owner

    try {
      await coin.setOwner(new2, {from: owner});
      assert.fail();
    } catch (exception) {
      assert.isTrue(exception.message.includes("revert"));
    }

    await coin.setOwner(new3, {from: vault});
    owner = new3;
    assert.equal(new3, await coin.getOwner({from: vault}));

    try {
      await coin.setOwner(new1, {from: admin});
      assert.fail();
    } catch (exception) {
      assert.isTrue(exception.message.includes("revert"));
    }
  });

  it("setVault", async () => {
    // only owner can set vault

    assert.equal(0, await coin.balanceOf(new3));
    let bal = Number(await coin.balanceOf(vault));
    assert.isTrue(bal > 0);

    await coin.setVault(new3, {from: owner});
    let oldVault = vault;
    vault = new3;
    assert.equal(new3, await coin.getVault({from: owner}));

    try {
      await coin.setVault(new1, {from: vault});
      assert.fail();
    } catch (exception) {
      assert.isTrue(exception.message.includes("revert"));
    }

    try {
      await coin.setVault(new2, {from: admin});
      assert.fail();
    } catch (exception) {
      assert.isTrue(exception.message.includes("revert"));
    }
  });
});
