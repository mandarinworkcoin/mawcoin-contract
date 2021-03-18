"use strict"

var MawCoin = artifacts.require("./MawCoin.sol");
const theBN = require("bn.js")

/**
 * MawCoin contract tests 2
 */
contract('MawCoin2', function(accounts) {
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

  let coin, OneMawCoinInMinunit, NoOfTokens, NoOfTokensInMinunit;

  const bnBalanceOf = async addr => await coin.balanceOf(addr);
  const bnReserveOf = async addr => await coin.reserveOf(addr);
  const bnAllowanceOf = async (owner, spender) => await coin.allowance(owner, spender);

  const balanceOf = async addr => (await coin.balanceOf(addr)).toString();
  const reserveOf = async addr => (await coin.reserveOf(addr)).toString();
  const allowanceOf = async (owner, spender) => (await coin.allowance(owner,spender)).toString();


  before(async () => {
    coin = await MawCoin.deployed();
    NoOfTokensInMinunit = await coin.totalSupply();
    OneMawCoinInMinunit = await coin.getOneMawCoin();
    NoOfTokens = NoOfTokensInMinunit.div(OneMawCoinInMinunit)
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

    const OneMawTimesTwoInMinunit = OneMawCoinInMinunit.mul(BIG(2))
    const OneMawTimesTwoInMinunitStr = OneMawTimesTwoInMinunit.toString()

    const OneMawTimesOneInMinunit = OneMawCoinInMinunit.mul(BIG(1))
    const OneMawTimesOneInMinunitStr = OneMawTimesOneInMinunit.toString()

    // send 2 Maw to user4 and set 1 Maw reserve
    coin.transfer(user4, OneMawTimesTwoInMinunit, {from: vault});
    coin.setReserve(user4, OneMawCoinInMinunit, {from: admin});
    assert.equal(await balanceOf(user4), OneMawTimesTwoInMinunitStr);
    assert.equal(await reserveOf(user4), OneMawCoinInMinunit.toString());

    // approve 2 Maw to user5
    await coin.approve(user5, OneMawTimesTwoInMinunit, {from:user4});
    assert.equal(await allowanceOf(user4, user5), OneMawTimesTwoInMinunitStr);

    // transfer 2 Maw from user4 to user5 SHOULD NOT BE POSSIBLE
    try {
      await coin.transferFrom(user4, user5, OneMawTimesTwoInMinunit, {from: user5});
      assert.fail();
    } catch(exception) {
      assert.isTrue(exception.message.includes("revert"));
    }

    // transfer 1 Maw from user4 to user5 SHOULD BE POSSIBLE
    await coin.transferFrom(user4, user5, OneMawTimesOneInMinunit, {from: user5});
    assert.equal(await balanceOf(user4), OneMawTimesOneInMinunitStr);
    assert.equal(await reserveOf(user4), OneMawTimesOneInMinunitStr); // reserve will not change
    assert.equal(await allowanceOf(user4, user5), OneMawTimesOneInMinunitStr); // allowance will be reduced
    assert.equal(await balanceOf(user5), OneMawTimesOneInMinunitStr);
    assert.equal(await reserveOf(user5), "0");

    // transfer .5 Maw from user4 to user5 SHOULD NOT BE POSSIBLE if balance <= reserve
    const halfMawInMinunit = OneMawCoinInMinunit.div(BIG(2));
    try {
      await coin.transferFrom(user4, user5, halfMawInMinunit, {from: user5});
      assert.fail();
    } catch(exception) {
      assert.isTrue(exception.message.includes("revert"));
    }
  })

  it("only minter can call mint", async() => {
      const OneMawTimesTenInMinunit = OneMawCoinInMinunit.mul(BIG(10))
      const OneMawTimesTenInMinunitStr = OneMawTimesTenInMinunit.toString()

      assert.equal(await balanceOf(user4), "0");

      await coin.mint(user4, OneMawTimesTenInMinunit, {from: minter})

      const totalSupplyAfterMintStr = (await coin.totalSupply()).toString()
      assert.equal(totalSupplyAfterMintStr, OneMawTimesTenInMinunit.add(NoOfTokensInMinunit).toString())
      assert.equal(await balanceOf(user4), OneMawTimesTenInMinunitStr);

      try {
          await coin.mint(user4, OneMawTimesTenInMinunit, {from: user4})
          assert.fail();
      } catch(exception) {
          assert.equal(totalSupplyAfterMintStr, OneMawTimesTenInMinunit.add(NoOfTokensInMinunit).toString())
          assert.isTrue(exception.message.includes("revert"));
      }
  })

  it("cannot mint above the mint cap", async() => {
      const OneMawTimes100BilInMinunit =
              OneMawCoinInMinunit.mul(BIG(100000000000))

      assert.equal(await balanceOf(user4), "0");


      try {
          await coin.mint(user4, OneMawTimes100BilInMinunit, {from: minter})
          assert.fail();
      } catch(exception) {
          assert.isTrue(exception.message.includes("revert"));
      }
  })
});
