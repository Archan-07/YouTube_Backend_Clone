import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import apiResponse from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend

  const { fullName, email, username, password } = req.body;
  console.log(email);

  // validation - not empty
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new apiError(400, "All fields are required");
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new apiError(400, "Invalid email format");
  }

  // Password validation
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (!passwordRegex.test(password)) {
    throw new apiError(
      400,
      "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character"
    );
  }
  // check if user already exists : using email and username
  // User.findOne get the first data from the database which is provided into the parameter
  // $or is operator which checks the value provided into the array
  const existedUser = User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new apiError(409, "User with email or username already exists");
  }

  // check for images , check for avatar

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  console.log(avatarLocalPath);
  console.log(coverImageLocalPath);

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar is required");
  }

  // upload them to cloudinary, avatar

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new apiError(400, "Avatar is required");
  }
  // create user object - create entry in db

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  console.log("Created user on db : " + user);

  // remove password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  console.log("Created user id : " + createdUser);

  // check for user creation
  if (!createdUser) {
    throw new apiError(500, "Something went wrong while registering user");
  }

  // return response

  return res
    .status(201)
    .json(new apiResponse(200, createdUser, "User registered successfully"));
});

export default registerUser;
