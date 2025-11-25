/**
 * Logger simples para o bot
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

class Logger {
  constructor() {
    this.prefix = '[Platefull Bot]';
  }

  _formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const dataStr = data ? `\n${JSON.stringify(data, null, 2)}` : '';
    return `${this.prefix} [${timestamp}] [${level}] ${message}${dataStr}`;
  }

  info(message, data = null) {
    console.log(
      `${colors.cyan}${this._formatMessage('INFO', message, data)}${colors.reset}`
    );
  }

  success(message, data = null) {
    console.log(
      `${colors.green}${this._formatMessage('SUCCESS', message, data)}${colors.reset}`
    );
  }

  warn(message, data = null) {
    console.warn(
      `${colors.yellow}${this._formatMessage('WARN', message, data)}${colors.reset}`
    );
  }

  error(message, error = null) {
    const errorData = error ? {
      message: error.message,
      stack: error.stack,
      ...error
    } : null;
    console.error(
      `${colors.red}${this._formatMessage('ERROR', message, errorData)}${colors.reset}`
    );
  }

  debug(message, data = null) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `${colors.magenta}${this._formatMessage('DEBUG', message, data)}${colors.reset}`
      );
    }
  }

  wpp(userId, slot, message, data = null) {
    console.log(
      `${colors.blue}${this._formatMessage(`WPP [${userId}:${slot}]`, message, data)}${colors.reset}`
    );
  }

  ai(message, data = null) {
    console.log(
      `${colors.magenta}${this._formatMessage('AI', message, data)}${colors.reset}`
    );
  }
}

export default new Logger();

