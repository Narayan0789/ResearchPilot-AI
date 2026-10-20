import { sendError } from '../utils/apiResponse.js';

export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
        403
      );
    }

    next();
  };
}
