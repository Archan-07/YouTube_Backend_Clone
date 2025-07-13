import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// for cors and configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// for json data and limits
app.use(
  express.json({
    limit: "16kb",
  })
);

// for url encoding
app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);

// for store public assets in folder
app.use(express.static("public"));

// for cookie
app.use(cookieParser());

export default app;
