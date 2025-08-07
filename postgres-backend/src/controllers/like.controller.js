import prisma from "../db/index.js";
import apiError from "../utils/ApiErrors.js";
import apiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user.id;

  const existingLike = await prisma.like.findUnique({
    where: {
      videoId_likedById: {
        videoId: videoId,
        likedById: userId,
      },
    },
  });

  if (existingLike) {
    await prisma.like.delete({ where: { id: existingLike.id } });
    return res
      .status(200)
      .json(
        new apiResponse(200, { isLiked: false }, "Like removed from video")
      );
  } else {
    await prisma.like.create({
      data: {
        videoId,
        likedById: userId,
      },
    });
    return res
      .status(201)
      .json(new apiResponse(201, { isLiked: true }, "Like added to video"));
  }
});
const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user.id;

  const existingLike = await prisma.like.findUnique({
    where: {
      tweetId_likedById: {
        tweetId,
        likedById: userId,
      },
    },
  });
  if (existingLike) {
    await prisma.like.delete({ where: { id: existingLike.id } });
    return res
      .status(200)
      .json(
        new apiResponse(200, { isLiked: false }, "Like removed from tweet")
      );
  } else {
    await prisma.like.create({
      data: {
        tweetId,
        likedById: userId,
      },
    });
    return res
      .status(201)
      .json(new apiResponse(201, { isLiked: true }, "Like added to tweet"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;

  const existingLike = await prisma.like.findUnique({
    where: {
      commentId_likedById: {
        commentId,
        likedById: userId,
      },
    },
  });

  if (existingLike) {
    await prisma.like.delete({ where: { id: existingLike.id } });
    return res
      .status(200)
      .json(
        new apiResponse(200, { isLiked: false }, "Like removed from comment")
      );
  } else {
    await prisma.like.create({
      data: {
        commentId,
        likedById: userId,
      },
    });
    return res
      .status(201)
      .json(new apiResponse(201, { isLiked: true }, "Like added to comment"));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { sortType = "desc" } = req.query;
  const likedVideos = await prisma.like.findMany({
    where: {
      likedById: userId,
      videoId: { not: null }, // Ensure we only get likes for videos
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      video: {
        include: {
          owner: {
            select: {
              username: true,
              avatar: true,
            },
          },
        },
      },
    },
  });
  return res.status(200).json(
    new apiResponse(
      200,
      likedVideos.map((like) => like.video),
      "Liked videos retrieved successfully"
    )
  );
});

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos };
