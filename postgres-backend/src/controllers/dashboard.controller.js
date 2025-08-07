import prisma from "../db/index.js";
import apiError from "../utils/ApiErrors.js";
import apiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const totalVideos = await prisma.video.findMany({
    where: { ownerId: userId },
  });

  const videoViews = await prisma.video.aggregate({
    _sum: {
      views: true,
    },
    where: {
      ownerId: userId,
    },
  });
  console.log(videoViews);

  const totalViews = videoViews._sum.views || 0;

  const totalLikes = await prisma.like.count({
    where: {
      video: {
        ownerId: userId,
      },
    },
  });
  const totalSubscribers = await prisma.subscription.count({
    where: { channelId: userId },
  });

  const stats = {
    totalVideos,
    totalViews,
    totalLikes,
    totalSubscribers,
  };

  return res
    .status(200)
    .json(new apiResponse(200, stats, "Channel stats fetched successfully"));
});
const getChannelVideos = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const videos = await prisma.video.findMany({
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
    .json(new apiResponse(200, videos, "Channel videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
