import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // file has been uploaded successfully
    console.log("File uploaded successfully on Cloudinary. URL:", response.url);

    // It's safer to check for existence before unlinking
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return response;
  } catch (error) {
    // Log the full error to see what Cloudinary is reporting
    console.error("CLOUDINARY UPLOAD ERROR:", error);

    // It's safer to check for existence before unlinking
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    // The upload operation failed, return null
    return null;
  }
};

export { uploadOnCloudinary };
