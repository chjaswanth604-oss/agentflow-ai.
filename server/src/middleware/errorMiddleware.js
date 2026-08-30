const errorHandler = (err, req, res, next) => {
  console.error('[Global Error Handler]', err);

  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  const errorCode = err.code || (err.name === 'ValidationError' ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR');

  res.status(statusCode).json({
    success: false,
    code: errorCode,
    message: err.message || 'Server error occurred',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;
