export default class Util {
  public static normalizeToEth(symbol: string, amount: number): number {
    if (symbol.toUpperCase() === 'ETH') {
      return amount
    } else if (symbol.toUpperCase() === 'WEI') {
      return amount/10e18
    } else {
      throw new Error(`Invalid symbol: should be either "ETH" or "Wei"`)
    }
  }
}
