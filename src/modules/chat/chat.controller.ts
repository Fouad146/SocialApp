import { Router } from "express";
import { ChateService } from "./chat.service";
import { Authentecation, mediaExtensions, multerCloud } from "../../middleware";

const chatRouter=Router({mergeParams:true})
const CS =new ChateService()

chatRouter.get("/",Authentecation(),CS.getChat)
chatRouter.get("/group/:groupId",Authentecation(),CS.getGroup)
chatRouter.post("/group",Authentecation(),multerCloud({fileType:mediaExtensions.image}).single("attachment"),CS.creatGroup)



export default chatRouter