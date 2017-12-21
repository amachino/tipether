import * as logger from 'winston'

logger.configure({
  level: 'debug',
  transports: [
    new logger.transports.Console({ colorize: true })
  ]
})

export default logger
