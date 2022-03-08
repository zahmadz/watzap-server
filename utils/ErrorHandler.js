const AppError = require('./AppError');
const Logger = require('./Logger');

module.exports = (err, req, res, next) => {
  Logger.error(`${err.message}, ${err.stack}`);

  function handleValidationError(err) {
    const message = Object.keys(err.errors)
      .map((key) => err.errors[key].message)
      .join(', ');
    return new AppError(400, message, 'VALIDATION_ERROR');
  }

  function handleDuplicateError(err) {
    const message = `${
      Object.keys(err.keyValue)[0]
    } is already in use, try another value.`;
    const data = { ...err.keyValue };

    return new AppError(400, message, 'DUPLICATE_ERROR', data);
  }

  function handleInvalidToken(err) {
    return new AppError(401, err.message, 'INVALID_TOKEN');
  }

  function handleTokenExpire(err) {
    return new AppError(
      401,
      'token expired, try signin again',
      'TOKEN_EXPIRED'
    );
  }

  if (err.name === 'ValidationError') err = handleValidationError(err);
  if (err.name === 'MongoError' && err.code === 11000)
    err = handleDuplicateError(err);
  if (err.name === 'JsonWebTokenError') err = handleInvalidToken(err);
  if (err.name === 'TokenExpiredError') err = handleTokenExpire(err);

  const errStatus = err.status || 'error';
  const statusCode = err.statusCode || 500;
  const errCode = err.errorCode || 'SOMETHING_WENT_WRONG';
  const errMessage =
    err.message || 'woops, something went wrong, try again later';
  const data = err.data || undefined;

  res.status(statusCode).json({
    status: errStatus,
    err_code: errCode,
    message: errMessage,
    data,
  });
};
