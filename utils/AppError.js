class AppError extends Error {
  constructor(statusCode, message, errorCode, data = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('5') ? 'error' : 'failed';
    this.errorCode = errorCode;
    this.data = data;
  }
}

module.exports = AppError;
