import prisma from "../db/index.js";
import apiError from "../utils/ApiErrors.js";
import apiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name || !description) {
    throw new apiError(400, "Name and description are required");
  }

  const playlist = await prisma.playlist.create({
    data: {
      name,
      description,
      ownerId: req.user.id,
    },
  });

  return res
    .status(201)
    .json(new apiResponse(201, playlist, "Playlist created successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { videoId, playlistId } = req.params;
  const existedVideo = await prisma.playlistVideo.findUnique({
    where: {
      playlistId_videoId: {
        playlistId,
        videoId,
      },
    },
  });
  if (existedVideo) {
    throw new apiError(400, "Video is already added");
  }
  const updatedPlaylist = await prisma.playlistVideo.create({
    data: {
      playlistId,
      videoId,
    },
  });
  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        updatedPlaylist,
        "Video added to playlist successfully"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
  });
  if (!playlist) {
    throw new apiError(404, "Playlist not found");
  }
  if (playlist.ownerId !== req.user.id) {
    throw new apiError(403, "You are not authorized to delete this playlist");
  }
  await prisma.playlist.delete({ where: { id: playlistId } });

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Playlist deleted successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    include: {
      videos: {
        include: {
          video: {
            include: {
              owner: {
                select: {
                  // for fetch video's owner username and avatar
                  username: true,
                  avatar: true,
                },
              },
            },
          },
        },
      },
      owner: {
        select: {
          username: true,
        },
      },
    },
  });

  if (!playlist) {
    throw new apiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, playlist, "Playlist fetched successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const playlists = await prisma.playlist.findMany({
    where: { ownerId: userId },
    include: {
      videos: {
        include: {
          video: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return res
    .status(200)
    .json(
      new apiResponse(200, playlists, "User playlists fetched successfully")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { videoId, playlistId } = req.params;
  const existedVideo = await prisma.playlistVideo.findUnique({
    where: {
      playlistId_videoId: {
        playlistId,
        videoId,
      },
    },
  });
  if (!existedVideo) {
    throw new apiError(404, "Video not found");
  }
  const updatedPlaylist = await prisma.playlistVideo.delete({
    where: {
      playlistId_videoId: {
        playlistId,
        videoId,
      },
    },
  });
  return res
    .status(200)
    .json(new apiResponse(200, {}, "Video removed from playlist successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!name || !description) {
    throw new apiError(400, "Name and description are required");
  }

  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
  });
  if (!playlist) {
    throw new apiError(404, "Playlist not found");
  }
  if (playlist.ownerId !== req.user.id) {
    throw new apiError(403, "You are not authorized to update this playlist");
  }

  const updatedPlaylist = await prisma.playlist.update({
    where: { id: playlistId },
    data: { name, description },
  });

  return res
    .status(200)
    .json(
      new apiResponse(200, updatedPlaylist, "Playlist updated successfully")
    );
});

export {
  createPlaylist,
  addVideoToPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylists,
  removeVideoFromPlaylist,
  updatePlaylist,
};
