import { Router } from "express";
import Ps from "./post.service"
import { Authentecation, mediaExtensions, multerCloud, Validation } from "../../middleware";
import * as Pv from "./post.validation";
import commentRouter from "../comment/comment.controller";


const postRouter =Router()
postRouter.use("/:postId/comments{/:commentId/reply}", commentRouter)

postRouter.post("/creatPost",Authentecation(),multerCloud({ fileType:mediaExtensions.image }).array("attachments"),Validation(Pv.creatPostSchema),Ps.creatPost)
postRouter.post("/reactPost/:postId",Authentecation(),Validation(Pv.reactPostSchema),Ps.reactPost)
postRouter.patch("/updatePost/:postId",Authentecation(),multerCloud({ fileType:mediaExtensions.image }).array("attachments"),Validation(Pv.updatePostSchema),Ps.updatePost)
postRouter.get("/getPosts",Ps.getPosts)





export default postRouter