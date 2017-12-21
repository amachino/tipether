import * as path from 'path'
import * as i18n from 'i18n'

i18n.configure({
  directory: path.join(__dirname + '/../locales')
})

export default i18n
