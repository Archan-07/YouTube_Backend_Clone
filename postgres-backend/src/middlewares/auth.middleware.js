import apiError from "../utils/ApiErrors.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import prisma from "../db/index.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new apiError(401, "Unauthorized Request");
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await prisma.user.findUnique({
      where: {
        id: decodedToken?.id,
      },
      omit: {
        password: true,
        refreshToken: true,
      },
    });
    if (!user) {
      // This can happen if the user has been deleted after the token was issued
      throw new apiError(401, "Invalid Access Token");
    }
    // 4. Attach the user object (without password/refresh token) to the request
    req.user = user;
    next();
  } catch (error) {
    // Handle potential JWT errors (e.g., token expired, malformed)
    // The error might not have a 'message' property, so provide a fallback.
    throw new apiError(401, error?.message || "Invalid access token");
  }
});
