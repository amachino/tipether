import * as Twit from 'twit'
import config from './config'
import __ from './i18n'

const api = new Twit({
  consumer_key: config.TWITTER_CONSUMER_KEY,
  consumer_secret: config.TWITTER_CONSUMER_SECRET,
  access_token: config.TWITTER_ACCESS_TOKEN,
  access_token_secret: config.TWITTER_ACCESS_TOKEN_SECRET
})

export interface User {
  id: number
  id_str: string
  name: string
  screen_name: string
  lang: string
  profile_image_url: string
  profile_image_url_https: string
}

export interface Tweet {
  created_at: string
  id: number
  id_str: string
  text: string
  source: string
  truncated: boolean
  in_reply_to_status_id?: number
  in_reply_to_status_id_str?: string
  in_reply_to_user_id?: number
  in_reply_to_user_id_str?: string
  in_reply_to_screen_name?: string
  user: User
  retweeted_status?: Tweet
  display_text_range?: object
}

export interface Message {
  created_at: string
  id: number
  id_str: string
  text: string
  sender_id: number
  sender_id_str: string
  sender_screen_name: string
  recipient_id: number
  recipient_id_str: string
  recipient_screen_name: string
  sender: User
  recipient: User
}

export class Twitter {

  public static getTweetStream(obj: { track: string }) {
    return api.stream('statuses/filter', { track: obj.track })
  }

  public static getUserStream() {
    return api.stream('user')
  }

  public static async getUser(obj: { screenName: string }): Promise<User|null> {
    const result = await api.get('users/lookup', { screen_name: obj.screenName })
    const data = result.data
    if (data && data.length > 0) {
      return data[0] as User
    } else {
      return null
    }
  }

  public static async postTweet(obj: { locale: string, phrase: string, data?: any }): Promise<Tweet> {
    const result = await api.post('statuses/update', {
      status: __({ phrase: obj.phrase, locale: obj.locale }, obj.data)
    })
    return result.data as Tweet
  }

  public static async postMentionTweet(obj: { username: string, locale: string, phrase: string, data?: any }): Promise<Tweet> {
    const result = await api.post('statuses/update', {
      status: `@${obj.username} \n` + __({ phrase: obj.phrase, locale: obj.locale }, obj.data)
    })
    return result.data as Tweet
  }

  public static async postReplyTweet(obj: { tweetId: string, username: string, locale: string, phrase: string, data?: any }): Promise<Tweet> {
    const result = await api.post('statuses/update', {
      status: `@${obj.username} ` + __({ phrase: obj.phrase, locale: obj.locale }, obj.data),
      in_reply_to_status_id: obj.tweetId
    })
    return result.data as Tweet
  }

  public static async postTweetWithMedia(obj: { mediaPath: string, locale: string, phrase: string, data?: any }): Promise<any> {
    return new Promise((resolve, reject) => {
      api.postMediaChunked({ file_path: obj.mediaPath }, async (err, data, response) => {
        if (err) {
          reject(err)
        }
        const result = await api.post('statuses/update', {
          media_ids: [data.media_id_string],
          status: __({ phrase: obj.phrase, locale: obj.locale }, obj.data)
        })
        resolve(result.data)
      })
    })
  }

  public static async postReplyTweetWithMedia(obj: { tweetId: string, username: string, mediaPath: string, locale: string, phrase: string, data?: any }): Promise<any> {
    return new Promise((resolve, reject) => {
      api.postMediaChunked({ file_path: obj.mediaPath }, async (err, data, response) => {
        if (err) {
          reject(err)
        }
        const result = await api.post('statuses/update', {
          in_reply_to_status_id: obj.tweetId,
          media_ids: [data.media_id_string],
          status: `@${obj.username} ` + __({ phrase: obj.phrase, locale: obj.locale }, obj.data)
        })
        resolve(result.data)
      })
    })
  }

  public static async postFavorite(obj: { id: string }): Promise<Tweet> {
    const result = await api.post('favorites/create', { id: obj.id })
    return result.data as Tweet
  }

  public static async postMessage(obj: { recipientId: string, locale: string, phrase: string, data?: any }): Promise<Message> {
    const result = await api.post('direct_messages/events/new', {
      event: {
        type: 'message_create',
        message_create: {
          target: { recipient_id: obj.recipientId },
          message_data: {
            text: __({ phrase: obj.phrase, locale: obj.locale }, obj.data)
          }
        }
      }
    })
    return result.data as Message
  }

}
