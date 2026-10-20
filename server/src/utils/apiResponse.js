export function sendSuccess(res, data = null, message = 'Success', statusCode = 200) {
  const response = {
    success: true,
    message
  };
  if (data !== null && data !== undefined) {
    response.data = data;
  }
  return res.status(statusCode).json(response);
}

export function sendError(res, message = 'An error occurred', statusCode = 500, errors = null) {
  const response = {
    success: false,
    message
  };
  if (errors) {
    response.errors = errors;
  }
  return res.status(statusCode).json(response);
}
