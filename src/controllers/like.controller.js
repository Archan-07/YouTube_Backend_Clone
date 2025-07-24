import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import apiError from "../utils/ApiErrors.js";
import apiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid video ID");
  }

  const userId = req.user._id;

  const existingLike = await Like.findOne({ likedBy: userId, video: videoId });
  console.log(existingLike);

  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });
    return res
      .status(200)
      .json(new apiResponse(200, {}, "Like removed from video"));
  } else {
    await Like.create({ likedBy: userId, video: videoId });
    return res
      .status(201)
      .json(new apiResponse(201, {}, "Like added to video"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  if (!commentId || !isValidObjectId(commentId)) {
    throw new apiError(400, "Invalid comment ID");
  }
  const userId = req.user._id;

  const existingLike = await Like.findOne({
    likedBy: userId,
    comment: commentId,
  });
  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });
    return res
      .status(200)
      .json(new apiResponse(200, {}, "Like removed from comment"));
  } else {
    await Like.create({ likedBy: userId, comment: commentId });
    return res
      .status(201)
      .json(new apiResponse(201, {}, "Like added to comment"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new apiError(400, "Invalid Tweet ID");
  }
  const userId = req.user._id;

  const existingLike = await Like.findOne({ likedBy: userId, tweet: tweetId });

  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });
    return res
      .status(200)
      .json(new apiResponse(200, {}, "Like removed from tweet"));
  } else {
    await Like.create({
      likedBy: userId,
      tweet: tweetId,
    });
    return res
      .status(200)
      .json(new apiResponse(200, {}, "Like added to tweet"));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const userId = req.user._id;

  const likedVideos = await Like.find({
    likedBy: userId,
    video: { $exists: true },
  }).populate("video", "title description thumbnailUrl");

  if (!likedVideos || likedVideos.length === 0) {
    return res
      .status(404)
      .json(new apiResponse(404, {}, "No liked videos found"));
  }
  return res
    .status(200)
    .json(
      new apiResponse(200, likedVideos, "Liked videos retrieved successfully")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
