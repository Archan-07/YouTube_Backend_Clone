import prisma from "../db/index.js";
import apiError from "../utils/ApiErrors.js";
import apiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriberId = req.user.id;

  if (subscriberId === channelId) {
    throw new apiError(400, "You cannot subscribe to your own channel");
  }

  const existingSubscription = await prisma.subscription.findUnique({
    where: {
      subscriberId_channelId: {
        subscriberId,
        channelId,
      },
    },
  });
  if (existingSubscription) {
    await prisma.subscription.delete({
      where: { id: existingSubscription.id },
    });
    return res
      .status(200)
      .json(
        new apiResponse(
          200,
          { isSubscribed: false },
          "Unsubscribed successfully"
        )
      );
  } else {
    const newSubscription = await prisma.subscription.create({
      data: {
        subscriberId,
        channelId,
      },
    });

    return res
      .status(201)
      .json(
        new apiResponse(201, { isSubscribed: true }, "Subscribed successfully")
      );
  }
});
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscribers = await prisma.subscription.findMany({
    where: { channelId },
    include: {
      subscriber: {
        select: {
          fullName: true,
          username: true,
          avatar: true,
        },
      },
    },
  });

  return res.status(200).json(
    new apiResponse(
      200,
      subscribers.map((sub) => sub.subscriber),
      "Subscribers fetched successfully"
    )
  );
});
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const subscriberId = req.user.id;
  const channels = await prisma.subscription.findMany({
    where: { subscriberId },
    include: {
      channel: {
        select: {
          username: true,
          fullName: true,
          avatar: true,
        },
      },
    },
  });
  return res.status(200).json(
    new apiResponse(
      200,
      channels.map((sub) => sub.channel),
      "Subscribed channels fetched successfully"
    )
  );
});

export { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription };
