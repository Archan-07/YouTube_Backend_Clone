import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import apiError from "../utils/ApiErrors.js";
import apiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet

  try {
    const { content } = req.body;
    if (!content) {
      throw apiError(400, "Content is required");
    }

    const tweet = await Tweet.create({
      content,
      owner: req.user._id,
    });

    if (!tweet) {
      throw apiError(500, "Failed to create tweet");
    }

    return res
      .status(201)
      .json(new apiResponse(201, tweet, "Tweet created successfully"));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new apiResponse(500, {}, "Internal Server Error"));
  }
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;
  if (!userId || !isValidObjectId(userId)) {
    throw new apiError(400, "Invalid user ID");
  }
  const tweets = await Tweet.find({ owner: userId }).populate(
    "owner",
    "username"
  );
  return res
    .status(200)
    .json(new apiResponse(200, tweets, "User tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { content } = req.body;
  if (!content) {
    throw new apiError(400, "Content is required");
  }
  const { tweetId } = req.params;
  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new apiError(400, "Invalid tweet ID");
  }
  const tweet = await Tweet.findByIdAndUpdate(
    tweetId,
    { $set: { content } },
    { new: true }
  );
  if (!tweet) {
    throw new apiError(404, "Tweet not found");
  }
  return res
    .status(200)
    .json(new apiResponse(200, tweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new apiError(404, "Tweet not found");
  }
  await tweet.deleteOne();
  return res
    .status(200)
    .json(new apiResponse(200, {}, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
