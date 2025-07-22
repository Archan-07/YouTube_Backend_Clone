import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import apiError from "../utils/ApiErrors.js";
import apiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;
  //TODO: get all videos based on query, sort, pagination
  const filter = { isPublished: true };

  if (userId) {
    filter.owner = userId;
  }
  if (query) {
    filter.title = { $regex: query, $options: "i" }; // case-insensitive search
  }

  const sortOptions = {
    [sortBy]: sortType === "asc" ? 1 : -1,
  };

  const aggregateQuery = Video.aggregate([
    { $match: filter },
    { $sort: sortOptions },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    {
      $unwind: {
        path: "$ownerDetails",
      },
    },
    {
      $project: {
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        thumbnail: 1,
        videoFile: 1,
        owner: "$ownerDetails.username",
        createdAt: 1,
      },
    },
  ]);

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };
  const result = await Video.aggregatePaginate(aggregateQuery, options);

  return res
    .status(200)
    .json(new apiResponse(200, result, "Videos retrieved successfully", {}));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    throw new apiError(400, "Title and description are required");
  }

  // 1. Validate and extract video file path
  const videoLocalPath = req.files?.videoFile?.[0]?.path;
  if (!videoLocalPath) {
    throw new apiError(400, "Video is required");
  }

  const video = await uploadOnCloudinary(videoLocalPath);
  if (!video?.url) {
    throw new apiError(400, "Failed to upload video");
  }

  // 2. Validate and extract thumbnail file path
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
  if (!thumbnailLocalPath) {
    throw new apiError(400, "Thumbnail is required");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnail?.url) {
    throw new apiError(400, "Failed to upload thumbnail");
  }

  // 3. Create video document in DB
  const publishedVideo = await Video.create({
    title,
    description,
    duration: video.duration,
    thumbnail: thumbnail.url,
    videoFile: video.url,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new apiResponse(201, publishedVideo, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  const video = await Video.findById(videoId).populate("owner", "username");
  if (!video) {
    throw new apiError(404, "Video not found");
  }
  return res
    .status(200)
    .json(new apiResponse(200, video, "Video retrieved successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!title || !description) {
    throw new apiError(400, "Title and description are required");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(404, "Video not found");
  }

  // Update video details
  video.title = title || video.title;
  video.description = description || video.description;

  await video.save();

  return res
    .status(200)
    .json(new apiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  //TODO: delete video
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(404, "Video not found");
  }

  if (String(video.owner) !== String(req.user._id)) {
    throw new apiError(403, "You are not authorized to delete this video");
  }

  await video.deleteOne();
  return res
    .status(200)
    .json(new apiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(404, "Video not found");
  }
  if (String(video.owner) !== String(req.user._id)) {
    throw new apiError(403, "You are not authorized to toggle publish status");
  }

  video.isPublished = !video.isPublished;
  await video.save();
  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        video,
        `Video is now ${video.isPublished ? "published" : "unpublished"}`
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
