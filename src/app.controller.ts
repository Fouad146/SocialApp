
import express, { Response, Request, NextFunction } from "express";
import { rateLimit } from "express-rate-limit";
import cors from "cors";
import helmet from "helmet";
import { AppErorr } from "./utils";
import { connectionDB } from "./DB";

import { resolve } from "path";
import { config } from "dotenv";
import userRouter from "./modules/user/user.controller";
import postRouter from "./modules/post/post.controller";
import { initializationIo } from "./modules/gateway/gateway.js";

config({ path: resolve(__dirname, "../config/.env") });

const app: express.Application = express();
const port = process.env.PORT || 5000;

const limmiter = rateLimit({
  limit: 5,
  windowMs: 1 * 60 * 1000,
  message: "wate to next respos",
  statusCode: 429,
  legacyHeaders: true,
});

const application = () => {
  app.use(express.json());
  app.use(helmet());
  app.use(cors());
  app.use(limmiter);
  connectionDB();
  app.get("/", (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({ message: "welcome in Social Media App" });
  });

  app.use("/users", userRouter);
  app.use("/posts", postRouter);
 ;


  app.use((err: AppErorr, req: Request, res: Response, next: NextFunction) => {
    return res.status(err.statusCode || 500).json({message:err.message});
  });
   const httpServer = app.listen(port, () => {
    console.log(`Server is running at ${port}`);
  });

  // app.get("{/*demo}", (req: Request, res: Response, next: NextFunction) => {
  //   throw new AppErorr("page not found", 404);
  // });
  initializationIo(httpServer)
};

export default application
