import * as path from 'path'
import * as i18n from 'i18n'

i18n.configure({
  directory: path.join(__dirname + '/../locales')
})

const locales = ['en']
const defaultLocale = 'en'

export default function __(obj: { phrase: string, locale: string }, data: any) {
  let locale = obj.locale
  if (locales.indexOf(locale) === -1) {
    locale = defaultLocale
  }
  return i18n.__({ phrase: obj.phrase, locale: locale }, data)
}
