import Compound from '@compound-finance/compound-js'// in Node.js

// Infura Provider URL
const provider  = 'https://mainnet.infura.io/v3/32e05464de764ee99ba990ee831eb0c1'

// Get the address Comptroller
const comptroller = Compound.util.getAddress(Compound.Comptroller)
// Get the address PriceFeed
const priceFeed = Compound.util.getAddress(Compound.PriceFeed)

//const cTokenDecimals = 8
const priceDecimals = Math.pow(10,6)
const blocksPerDay = 4*60*24 // block every approx 15 seconds is 4 blocks per minute
const daysPerYear = 365
const ethMantissa = Math.pow(10,18) // 1e18

// calculate SupplyAPY using supplyRatePerBlock
const calculateSupplyAPY = async (cToken) => {

    const supplyRatePerBlock = await Compound.eth.read(
        cToken,
        'function supplyRatePerBlock() returns (uint)',
        [], // [optional] parameters
        { provider }  // [optional] call options, provider, network, ethers.js "overrides"
    )

    const unscaledSupplyRatePerBlock = supplyRatePerBlock / ethMantissa

    const supplyRatePerDay = unscaledSupplyRatePerBlock * blocksPerDay

    const compoundedValueYear = Math.pow(1+supplyRatePerDay, daysPerYear-1)

    const APY = compoundedValueYear - 1

    return APY * 100 // return as a percentage

}

// calculate e.g CompAPY using compSpeed supply per block
const calculateCompRateAPY = async (cToken, tickerUnderlying, decimalsUnderlying) => {

    const compSpeedPerBlock = await Compound.eth.read(
        comptroller,
        'function compSpeeds(address cToken) public returns (uint)',
        [cToken], // pass cToken (market)
        { provider }  // [optional] call options, provider, network, ethers.js "overrides"
    )

    // get the compoundPrice
    const compoundPrice =  await Compound.eth.read(
        priceFeed,
        'function price(string memory symbol) external view returns (uint)',
        [Compound.COMP], // pass Compound Ticker
        { provider }  // [optional] call options, provider, network, ethers.js "overrides"
    )

    // get the underlyingPrice
    const underlyingPrice =  await Compound.eth.read(
        priceFeed,
        'function price(string memory symbol) external view returns (uint)',
        [tickerUnderlying], // pass underlying Ticker
        { provider }  // [optional] call options, provider, network, ethers.js "overrides"
    )

    // get the totalSupply cToken based on amount of lenders in he underlyingAsset
    const totalSupplycToken =  await Compound.eth.read(
        cToken,
        'function totalSupply() returns (uint)',
        [], // 
        { provider }  // [optional] call options, provider, network, ethers.js "overrides"
    )

    // get the current exchangeRate cToken to underlying e.g 1cDai = 10DAI
    let exchangeRate =  await Compound.eth.read(
        cToken,
        'function exchangeRateCurrent() returns (uint)',
        [], // 
        { provider }  // [optional] call options, provider, network, ethers.js "overrides"
    )

    // unscaled values 
    const compSpeedPerBlockUnscaled = compSpeedPerBlock / ethMantissa // COMP has 18 decimal places
    const compPriceUnscaled = compoundPrice / priceDecimals  //price feed is USD price with 6 decimal places
    const underlyingPriceUnscaled = underlyingPrice / priceDecimals //price feed is USD price with 6 decimal places
    const exchangeRateUnscaled = +exchangeRate.toString() / ethMantissa 
    const totalSupply = (+totalSupplycToken.toString() * exchangeRateUnscaled * underlyingPriceUnscaled )/ (Math.pow(10, decimalsUnderlying))

    // compPerDay 
    const compPerDay = compSpeedPerBlockUnscaled * blocksPerDay

    return 100 * (compPriceUnscaled * compPerDay / totalSupply) * 365;

}

// get price underlying
const getPriceUnderlying = async (tickerUnderlying) => {
    // get the underlyingPrice
    const underlyingPrice =  await Compound.eth.read(
        priceFeed,
        'function price(string memory symbol) external view returns (uint)',
        [tickerUnderlying], // pass underlying Ticker
        { provider }  // [optional] call options, provider, network, ethers.js "overrides"
    )
    const underlyingPriceUnscaled = underlyingPrice / priceDecimals //price feed is USD price with 6 decimal places
    return underlyingPriceUnscaled

}

const data = async (cToken, tickerUnderlying) => {
    const underlyingDecimals = Compound.decimals[cToken.slice(1,10)]
    const cTokenAddress = Compound.util.getAddress(cToken)
    const [priceUnderlying, supplyApy, compApy] = await Promise.all([
      getPriceUnderlying(tickerUnderlying),
      calculateSupplyAPY(cTokenAddress),
      calculateCompRateAPY(cTokenAddress, tickerUnderlying, underlyingDecimals)
    ]);
    return {tickerUnderlying, priceUnderlying, supplyApy, compApy};
}

export default data

