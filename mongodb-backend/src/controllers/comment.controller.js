import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import apiError from "../utils/ApiErrors.js";
import apiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!videoId || !mongoose.isValidObjectId(videoId)) {
    return apiError(res, "Invalid video ID", 400);
  }

  const comments = await Comment.find({ video: videoId })
    .populate("owner", "username")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  return res
    .status(200)
    .json(new apiResponse(200, comments, "Comments retrieved successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video

  const { content } = req.body;
  const { videoId } = req.params;
  const ownerId = req.user._id;

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: ownerId,
  });

  if (!comment) {
    return apiError(res, "Failed to add comment", 500);
  }

  return res
    .status(201)
    .json(new apiResponse(201, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;
  const comment = await Comment.findByIdAndUpdate(
    commentId,
    { content },
    { new: true }
  );

  if (!comment) {
    return apiError(res, "Comment not found", 404);
  }

  return res
    .status(200)
    .json(new apiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment

  const { commentId } = req.params;
  const comment = await Comment.findByIdAndDelete(commentId);
  if (!comment) {
    return apiError(res, "Comment not found", 404);
  }
  return res
    .status(200)
    .json(new apiResponse(200, {}, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
