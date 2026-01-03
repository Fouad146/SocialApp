import { Router } from "express";
import Cs from "./comment.service"
import * as Cv from "./comment.validation"

import { multerCloud,Authentecation, mediaExtensions, Validation } from "../../middleware";

const commentRouter =Router({mergeParams:true})
commentRouter.post("/creatcomment",Authentecation(),multerCloud({ fileType:mediaExtensions.image }).array("attachments"),Validation(Cv.creatCommentSchema),Cs.creatcomment)





export default commentRouter