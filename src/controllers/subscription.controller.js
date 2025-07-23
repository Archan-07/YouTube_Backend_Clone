import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscriptions.model.js";
import apiError from "../utils/ApiErrors.js";
import apiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriberId = req.user._id;
  // TODO: toggle subscription

  if (subscriberId.toString() === channelId) {
    throw new apiError(400, "You cannot subscribe to your own channel");
  }

  const existingSubscription = await Subscription.findOne({
    subscriber: subscriberId,
    channel: channelId,
  });
  if (existingSubscription) {
    await Subscription.deleteOne({
      subscriber: subscriberId,
      channel: channelId,
    });
    return res
      .status(200)
      .json(new apiResponse(200, {}, "Unsubscribed successfully"));
  } else {
    const newSubscription = await Subscription.create({
      subscriber: subscriberId,
      channel: channelId,
    });

    return res
      .status(200)
      .json(new apiResponse(200, newSubscription, "Subscribed Successfully"));
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const subscriptions = await Subscription.find({
    channel: channelId,
  }).populate("subscriber", "fullName username email");
  console.log(subscriptions);

  return res.status(200).json(
    new apiResponse(
      200,
      {
        subscribers: subscriptions.map((sub) => sub.subscriber),
      },
      "Subscribers fetched successfully"
    )
  );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  const subscriptions = await Subscription.find({
    subscriber: subscriberId,
  }).populate("channel", "fullName username email");

  return res.status(200).json(
    new apiResponse(
      200,
      {
        channels: subscriptions.map((sub) => sub.channel),
      },
      "Subscribed channels fetched successfully"
    )
  );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
