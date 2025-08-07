import dotenv from "dotenv";

// 1. CONFIGURE ENVIRONMENT VARIABLES FIRST
// This line runs immediately and populates process.env
dotenv.config({
  path: "./.env",
});

// 2. NOW IMPORT YOUR OTHER MODULES
// These imports will now run in an environment where process.env is already populated.
import app from "./app.js";
import prisma from "./db/index.js"; // or "./db/prisma.js" depending on your structure

// 3. START THE SERVER
const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected successfully!");

    app.on("error", (error) => {
      console.error("EXPRESS APP ERROR : ", error);
    });

    const PORT = process.env.PORT || 8000; // This will now work correctly
    app.listen(PORT, () => {
      console.log(`🚀 Server is running at port : ${PORT}`);
    });
  } catch (error) {
    console.error(
      "Failed to connect to the database. Server is not starting.",
      error
    );
    process.exit(1);
  }
};

startServer();
