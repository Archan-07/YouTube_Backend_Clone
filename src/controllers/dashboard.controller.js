import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscriptions.model.js";
import { Like } from "../models/like.model.js";
import apiError from "../utils/ApiErrors.js";
import apiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const userId = req.user._id;

  if (!userId) {
    throw new apiError(401, "User not authenticated");
  }

  const totalVideos = await Video.countDocuments({ owner: userId });
  const videos = await Video.find({ owner: userId });
  const totalViews = videos.reduce((acc, video) => acc + video.views, 0);

  const videoIds = videos.map((video) => video._id);

  const totalLikes = await Like.countDocuments({
    video: { $in: videoIds },
  });

  const totalSubscribers = await Subscription.countDocuments({
    channel: userId,
  });

  return res.status(200).json(
    new apiResponse(
      200,
      {
        totalVideos,
        totalViews,
        totalLikes,
        totalSubscribers,
      },
      "Channel stats fetched successfully"
    )
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const userId = req.user._id;
  if (!userId) {
    throw new apiError(401, "User not authenticated");
  }
  const videos = await Video.find({ owner: userId })
    .populate("owner", "username ")
    .sort({ createdAt: -1 });
  return res
    .status(200)
    .json(new apiResponse(200, videos, "Channel videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
