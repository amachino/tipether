import store from './store'

export type TokenData = {
  enabled: boolean,
  symbol: string,
  maxTipAmount: number,
  maxWithdrawAmount: number,
  maxDepositAmount: number,
  defaultTipAmount: number
}

export type TokenMap = {
  [key: string]: TokenData
}

export class Token {

  private static readonly collection = 'tokens'

  public static async getAll(): Promise<TokenMap> {
    const tokens = {}
    const result = await store.collection(this.collection).where('enabled', '==', true).get()
    result.forEach(doc => {
      const data = doc.data() as TokenData
      tokens[data.symbol] = data
    })
    return tokens
  }

  public static async get(id: string): Promise<TokenData> {
    const result = await store.collection(this.collection).doc(id).get()
    return result.data() as TokenData
  }

}
