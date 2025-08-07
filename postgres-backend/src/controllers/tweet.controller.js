import prisma from "../db/index.js";
import apiError from "../utils/ApiErrors.js";
import apiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) {
    throw new apiError(400, "Content is required");
  }

  const tweet = await prisma.tweet.create({
    data: {
      content,
      ownerId: req.user.id,
    },
  });

  return res
    .status(201)
    .json(new apiResponse(201, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    throw new apiError(400, "Invalid user ID");
  }
  const tweets = await prisma.tweet.findMany({
    where: { ownerId: userId },
    include: {
      owner: {
        select: {
          username: true,
          avatar: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return res
    .status(200)
    .json(new apiResponse(200, tweets, "User tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) {
    throw new apiError(400, "Content is required");
  }
  const { tweetId } = req.params;
  if (!tweetId) {
    throw new apiError(400, "Invalid tweet ID");
  }

  const tweet = await prisma.tweet.findUnique({ where: { id: tweetId } });
  if (!tweet) {
    throw new apiError(404, "Tweet not found");
  }
  if (tweet.ownerId !== req.user.id) {
    throw new apiError(403, "You are not authorized to update this tweet");
  }

  const updatedTweet = await prisma.tweet.update({
    where: { id: tweetId },
    data: { content },
  });

  return res
    .status(200)
    .json(new apiResponse(200, updatedTweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!tweetId) {
    throw new apiError(400, "Invalid tweet ID");
  }

  const tweet = await prisma.tweet.findUnique({ where: { id: tweetId } });
  if (!tweet) {
    throw new apiError(404, "Tweet not found");
  }
  if (tweet.ownerId !== req.user.id) {
    throw new apiError(403, "You are not authorized to delete this tweet");
  }
  await prisma.tweet.delete({ where: { id: tweetId } });

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet,deleteTweet };
