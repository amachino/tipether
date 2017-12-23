import axios from 'axios'
import config from './config'
import logger from './logger'

export default class API {

  public static getAddress(data: { id: string }): Promise<{ address: string }> {
    return this.call(config.API_FUNC_GET_ADDRESS, data)
  }

  public static getBalance(data: { id: string }): Promise<{ balance: number }> {
    return this.call(config.API_FUNC_GET_BALANCE, data)
  }

  public static tipEther(data: { senderId: string, receiverId: string, amount: number }): Promise<{ txId: string }> {
    return this.call(config.API_FUNC_TIP_ETHER, data)
  }

  public static withdrawEther(data: { senderId: string, address: string, amount: number }): Promise<{ txId: string }> {
    return this.call(config.API_FUNC_WITHDRAW_ETHER, data)
  }

  private static async call(name: string, data: any): Promise<any> {
    const result = await axios({
      url: name,
      method: 'post',
      baseURL: config.API_BASE_URL,
      data: data,
      headers: { Authorization: `Bearer ${config.API_ACCESS_TOKEN}` }
    })
    return result.data
  }

}
