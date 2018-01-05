export default class Utils {

  public static normalizeToEth(symbol: string, amount: number): number {
    if (symbol.toUpperCase() === 'ETH') {
      return amount
    } else if (symbol.toUpperCase() === 'WEI') {
      return amount / 10e18
    } else {
      throw new Error(`Invalid symbol: should be either "ETH" or "Wei"`)
    }
  }

  public static validateAddress(address: string): boolean {
    if (/0x[0-9a-fA-F]{40}/.test(address) || /[0-9a-zA-Z-]+\.eth/.test(address)) {
      return true
    } else {
      return false
    }
  }

}
