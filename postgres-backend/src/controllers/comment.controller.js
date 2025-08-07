import prisma from "../db/index.js";
import apiError from "../utils/ApiErrors.js";
import apiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const comments = await prisma.comment.findMany({
    where: { videoId },
    skip: (page - 1) * limit,
    take: parseInt(limit),
    include: { owner: { select: { username: true, avatar: true } } },
    orderBy: { createdAt: "desc" },
  });

  const totalComments = await prisma.comment.count({ where: { videoId } });
  return res.status(200).json(
    new apiResponse(
      200,
      {
        data: comments,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalComments / limit),
        totalDocs: totalComments,
      },
      "Comments retrieved successfully"
    )
  );
});

const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { videoId } = req.params;

  if (!content) {
    throw new apiError(400, "Content is required");
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      videoId,
      ownerId: req.user.id,
    },
    include: {
      owner: {
        select: {
          username: true,
          avatar: true,
        },
      },
    },
  });

  return res
    .status(201)
    .json(new apiResponse(201, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new apiError(400, "Content is required");
  }

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) {
    return apiError(res, "Comment not found", 404);
  }

  if (comment.ownerId !== req.user.id) {
    throw new apiError(403, "You are not authorized to update this comment");
  }

  const updatedComment = await prisma.comment.update({
    where: { id: commentId },
    data: {
      content,
    },
  });

  return res
    .status(200)
    .json(new apiResponse(200, updatedComment, "Comment updated successfully"));
});
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) {
    throw new apiError(404, "Comment not found");
  }

  if (comment.ownerId !== req.user.id) {
    throw new apiError(403, "You are not authorized to delete this comment");
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Comment deleted successfully"));
});
export { getVideoComments, addComment, updateComment, deleteComment };
