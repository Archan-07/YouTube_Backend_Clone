import prisma from "../db/index.js";
import apiError from "../utils/ApiErrors.js";
import apiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  // The where clause defines filters:

  const where = {
    // All videos must be isPublished: true
    isPublished: true,
  };
  // If userId is provided, only videos by that user are returned
  if (userId) {
    where.ownerId = userId;
  }
  // If a query is provided, it does a case-insensitive partial match on the video title
  if (query) {
    where.title = {
      contains: query,
      mode: "insensitive", // case-insensitive search
    };
  }

  const videos = await prisma.video.findMany({
    where,
    skip: (page - 1) * limit,
    take: parseInt(limit),
    orderBy: {
      [sortBy]: sortType,
    },
    include: {
      owner: {
        select: {
          // used for return the perticular data rather than whole owner
          username: true,
          avatar: true,
        },
      },
    },
  });

  const totalVideos = await prisma.video.count({ where });
  return res.status(200).json(
    new apiResponse(
      200,
      {
        data: videos,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalVideos / limit),
        totalDocs: totalVideos,
      },
      "Videos retrieved successfully"
    )
  );
});

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    throw new apiError(400, "Title and description are required");
  }

  const videoLocalPath = req.files?.videoFile?.[0]?.path;
  if (!videoLocalPath) {
    throw new apiError(400, "Video is required");
  }

  const videoFile = await uploadOnCloudinary(videoLocalPath);

  if (!videoFile?.url) {
    throw new apiError(400, "Failed to upload video");
  }

  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
  if (!thumbnailLocalPath) {
    throw new apiError(400, "Thumbnail is required");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnail?.url) {
    throw new apiError(400, "Failed to upload thumbnail");
  }

  const publishedVideo = await prisma.video.create({
    data: {
      title,
      description,
      thumbnail: thumbnail.url,
      videoFile: videoFile.url,
      duration: videoFile.duration,
      ownerId: req.user.id,
    },
  });

  return res
    .status(201)
    .json(new apiResponse(201, publishedVideo, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      owner: {
        select: {
          username: true,
          fullName: true,
          avatar: true,
        },
      },
      likes: true,
    },
  });

  if (!video) {
    throw new apiError(404, "Video not found");
  }

  // if User id loggedIn
  if (req.user) {
    await prisma.watchHistory.upsert({
      //upsert : update or insert
      where: {
        userId_videoId: {
          userId: req.user.id,
          videoId: videoId,
        },
      },
      update: {
        watchedAt: new Date(), // if already watched than update time
      },
      create: {
        userId: req.user.id,
        videoId: videoId,
      },
    });
  }

  // update view count

  const updatedVideo = await prisma.video.update({
    where: { id: videoId },
    data: {
      views: {
        increment: 1,
      },
    },
  });

  return res
    .status(200)
    .json(new apiResponse(200, updatedVideo, "Video retrieved successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!title || !description) {
    throw new apiError(400, "Title and description are required");
  }

  const video = await prisma.video.findUnique({
    where: { id: videoId },
  });
  if (!video) {
    throw new apiError(404, "Video not found");
  }

  if (video.ownerId !== req.user.id) {
    throw new apiError(403, "You are not authorized to update this video");
  }

  const updatedVideo = await prisma.video.update({
    where: { id: videoId },
    data: {
      title,
      description,
    },
  });

  return res
    .status(200)
    .json(new apiResponse(200, updatedVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await prisma.video.findUnique({
    where: { id: videoId },
  });
  if (!video) {
    throw new apiError(404, "Video not found");
  }

  if (video.ownerId !== req.user.id) {
    throw new apiError(403, "You are not authorized to delete this video");
  }

  await prisma.video.delete({ where: { id: videoId } });

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) {
    throw new apiError(404, "Video not found");
  }
  if (video.ownerId !== req.user.id) {
    throw new apiError(403, "You are not authorized to toggle publish status");
  }
  const updatedVideo = await prisma.video.update({
    where: { id: videoId },
    data: {
      isPublished: !video.isPublished,
    },
  });
  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        updatedVideo,
        `Video is now ${updatedVideo.isPublished ? "published" : "unpublished"}`
      )
    );
});

export {
  getAllVideos,
  publishVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
