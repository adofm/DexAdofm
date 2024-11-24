import { NextFunction, Request, Response } from "express";
import { JWT_SECRET, WORKER_JWT_SECRET } from "./config";
import jwt from "jsonwebtoken";

/**
 * Helper function to verify JWT and attach the userId to the request object.
 * 
 * This function is used by both `authMiddleware` and `workerMiddleware` to verify the 
 * JWT token from the Authorization header. If the token is valid, it decodes the 
 * token and attaches the `userId` to the `req` object, which can then be used 
 * in subsequent middleware or route handlers.
 * 
 * If the token is invalid, expired, or missing, a `403` status response is sent 
 * back with a relevant error message.
 * 
 * @param secret The secret key used to verify the JWT token.
 * @param req The request object.
 * @param res The response object.
 * @param next The next middleware function to be called.
 */
function verifyJwt(secret: string, req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"] ?? "";

  if (!authHeader) {
    return res.status(403).json({
      message: "Authorization header missing", 
    });
  }

  try {
    const decoded = jwt.verify(authHeader, secret);

    if ((decoded as { userId: number }).userId) {
      // @ts-ignore
      req.userId = (decoded as { userId: number }).userId;
      return next(); 
    } else {
      return res.status(403).json({
        message: "You are not logged in", 
      });
    }
  } catch (e) {
    return res.status(403).json({
      message: "Invalid token or expired token", 
    });
  }
}

/**
 * Middleware to authenticate general users.
 * 
 * This middleware function is responsible for authenticating general users by 
 * verifying the JWT token from the Authorization header. It uses the 
 * `JWT_SECRET` for token verification. If the token is valid, the `userId` is 
 * extracted from the token and attached to the `req` object.
 * 
 * If the token is invalid or missing, a `403` status response is sent with a 
 * message indicating that the user is not logged in.
 * 
 * @param req The request object.
 * @param res The response object.
 * @param next The next middleware function to be called.
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  return verifyJwt(JWT_SECRET, req, res, next);
}

/**
 * Middleware to authenticate workers.
 * 
 * This middleware function is responsible for authenticating workers by 
 * verifying the JWT token from the Authorization header. It uses the 
 * `WORKER_JWT_SECRET` for token verification. If the token is valid, the 
 * `userId` is extracted from the token and attached to the `req` object.
 * 
 * If the token is invalid or missing, a `403` status response is sent with a 
 * message indicating that the worker is not logged in.
 * 
 * @param req The request object.
 * @param res The response object.
 * @param next The next middleware function to be called.
 */
export function workerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  return verifyJwt(WORKER_JWT_SECRET, req, res, next);
}
