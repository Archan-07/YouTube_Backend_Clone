import asyncHandler from "../utils/asyncHandler.js";
import prisma from "../db/index.js";
import apiError from "../utils/ApiErrors.js";
import apiResponse from "../utils/ApiResponse.js";
import bcrypt from "bcrypt";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new apiError(404, "User not found");
    }

    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
      }
    );
    const refreshToken = jwt.sign(
      {
        id: user.id,
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
      }
    );

    // Update the user's refresh token in the database
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(
      500,
      "Something went wrong while generating access and refresh tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new apiError(400, "All fields are required");
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new apiError(400, "Invalid email format");
  }

  // Password validation
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (!passwordRegex.test(password)) {
    throw new apiError(
      400,
      "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character"
    );
  }

  const existedUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username: username.toLowerCase() }],
    },
  });

  if (existedUser) {
    throw new apiError(409, "User with email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar is required");
  }

  // upload them to cloudinary, avatar

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new apiError(400, "Avatar is required");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const createdUser = await prisma.user.create({
    data: {
      fullName,
      email,
      username: username.toLowerCase(),
      password: hashedPassword,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
    },
    select: {
      id: true,
      username: true,
      email: true,
      fullName: true,
    },
  });
  if (!createdUser) {
    throw new apiError(500, "Something went wrong while registering user");
  }
  return res
    .status(201)
    .json(new apiResponse(201, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new apiError(400, "Username or email is required");
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (!user) {
    throw new apiError(404, "User does not exist");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new apiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user.id
  );

  const loggedInUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      username: true,
      email: true,
      fullName: true,
      avatar: true,
      coverImage: true,
    },
  });

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {

  await prisma.user.update({
    where: {
      id: req.user.id,
    },
    data: {
      refreshToken: null,
    },
  });

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const inCommingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;
    if (!inCommingRefreshToken) {
      throw new apiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(
      inCommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await prisma.user.findUnique({
      where: { id: decodedToken?.id },
    });
    if (!user) {
      throw new apiError(401, "Invalid refresh token");
    }

    if (inCommingRefreshToken !== user?.refreshToken) {
      throw new apiError(401, "Refresh token is invalid or expired");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newrefreshToken } =
      await generateAccessAndRefreshTokens(user.id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new apiResponse(
          200,
          {
            accessToken,
            newrefreshToken,
          },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    throw new apiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
  if (!isPasswordCorrect) {
    throw new apiError(400, "Invalid old password");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashedPassword },
  });
  return res
    .status(200)
    .json(new apiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new apiResponse(200, req.user, "Current user fetched successfully"));
});

const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new apiError(400, "Full name and email are required");
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { fullName, email },
    select: {
      id: true,
      username: true,
      email: true,
      fullName: true,
    },
  });
  return res
    .status(200)
    .json(new apiResponse(200, user, "Account details updated successfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new apiError(400, "Error while uploading avatar on cloudinary");
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: { avatar: avatar.url },
    select: { id: true, avatar: true },
  });
  return res
    .status(200)
    .json(new apiResponse(200, updatedUser, "Avatar updated successfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new apiError(400, "Cover Image file is missing");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url) {
    throw new apiError(400, "Error while uploading coverImage on cloudinary");
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: { coverImage: coverImage.url },
    select: { id: true, coverImage: true },
  });
  return res
    .status(200)
    .json(
      new apiResponse(200, updatedUser, "Cover Image uploaded successfully")
    );
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new apiError(400, "Username is missing");
  }

  const channel = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      id: true,
      username: true,
      fullName: true,
      avatar: true,
      coverImage: true,
      email: true,
      subscriptions: true,
      subscribers: {
        select: { subscriberId: true },
      },
    },
  });
  if (!channel) {
    throw new apiError(404, "Channel does not exist");
  }

  const subscribersCount = channel.subscribers.length;
  const channelSubscribedToCount = channel.subscriptions.length;

  const isSubscribed = channel.subscribers.some(
    (sub) => sub.subscriberId === req.user?.id
  );

  delete channel.subscribers;
  delete channel.subscriptions;

  const profile = {
    ...channel,
    subscribersCount,
    channelSubscribedToCount,
    isSubscribed,
  };

  return res
    .status(200)
    .json(
      new apiResponse(200, profile, "User channel profile fetched successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const watchHistory = await prisma.watchHistory.findMany({
    where: { userId: req.user.id },
    include: {
      video: {
        include: {
          owner: {
            select: {
              username: true,
              fullName: true,
              avatar: true,
            },
          },
        },
      },
    },
    orderBy: {
      watchedAt: "desc",
    },
  });

  const videos = watchHistory.map((history) => history.video);
  return res
    .status(200)
    .json(new apiResponse(200, videos, "Watch history fetched successfully"));
});

export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserDetails,
  updateAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
