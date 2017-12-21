import store from './store'

enum Type {
  TIP = 'TIP',
  WITHDRAW = 'WITHDRAW'
}

export default class Receipt {

  private static readonly collection = 'receipts'

  public static async createTipReceipt(id: string, data: { tweetId: string, senderId: string, receiverId: string, amount: number, symbol: string, txId: string }) {
    const now = new Date().getTime()
    return store.collection(this.collection).doc(id).set({
      type: Type.TIP,
      ...data,
      createdAt: now
    })
  }

  public static async createWithdrawReceipt(id: string, data: { tweetId: string, senderId: string, receiverAddress: string, amount: number, symbol: string, txId: string }) {
    const now = new Date().getTime()
    return store.collection(this.collection).doc(id).set({
      type: Type.WITHDRAW,
      ...data,
      createdAt: now
    })
  }

}
