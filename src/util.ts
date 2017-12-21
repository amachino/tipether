export default class Util {
  public static normalizeToEth(symbol: string, amount: number, maxAmount: number):
      {amount: number, maxAmount: number} {
    if (symbol.toUpperCase() === 'ETH') {
      return {
        amount: amount,
        maxAmount: maxAmount
      }
    } else if (symbol.toUpperCase() === 'WEI') {
      return {
        amount: amount/10e18,
        maxAmount: maxAmount/10e18
      }

    } else {
      throw new Error(`Invalid symbol: should be either "ETH" or "Wei"`)
    }
  }
}
