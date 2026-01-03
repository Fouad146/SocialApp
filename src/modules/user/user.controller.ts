import { Router } from "express";
import US from "./user.service";
import { Authentecation, Validation,mediaExtensions,multerCloud } from "../../middleware";
import { forgetPasswordSchima, freezeAccountSchima, logOutSchima, OtpSchma, resetPasswordSchima, signInSchima, signUpSchima, updatePasswordSchima } from "./user.validation";
import { TokenType } from "../../utils/index";
import chatRouter from "../chat/chat.controller";




const userRouter =Router()

userRouter.use("/:userId/chat",chatRouter)
userRouter.post("/signup",Validation(signUpSchima),US.signUp)
userRouter.get("/confermOTP",Validation(OtpSchma),US.confermOTP)
userRouter.get("/confirmEmail/:token",US.confermEmailWithToken)
userRouter.post("/signin",Validation(signInSchima),US.signIn)
userRouter.get("/profile",Authentecation(),US.profile)
userRouter.delete("/logout",Authentecation(),Validation(logOutSchima),US.logout)
userRouter.get("/refreshToken",Authentecation(TokenType.Refresh),US.refreshToken)
userRouter.get("/loginWithGmail",US.loginWithGmail)
userRouter.patch("/forgetPassword",Validation(forgetPasswordSchima),US.forgetPassword)
userRouter.patch("/resetPassword{/:token}",Validation(resetPasswordSchima),US.resetPassword)
userRouter.patch("/updatePassword",Authentecation(),Validation(updatePasswordSchima),US.updatePassword)
userRouter.post("/uploadProfileImage",Authentecation(),US.uploadProfileImage)
userRouter.post("/uploadCaverImage",Authentecation(), multerCloud({fileType:mediaExtensions.image}).single("file"),US.uploadCaverImage)
userRouter.post("/uploadSomePhotos",Authentecation(), multerCloud({fileType:mediaExtensions.image}).array("files" ),US.uploadSomePhotos)
userRouter.get("/getUploadFile/*path",US.getUploadFile)
userRouter.get("/dowenlodeUploadFile/*path",US.dowenlodeUploadFile)
userRouter.get("/creatFileUrlpresign/*path",US.creatFileUrl)
userRouter.get("/creatDownloadeFileUrlpresign/*path",US.creatFileDawnloadUrl)
userRouter.get("/deleteFile/*path",US.deleteFile)
userRouter.get("/getListFiles/*path",US.getListFiles)
userRouter.delete("/freezeAccount{/:userId}",Authentecation(),Validation(freezeAccountSchima),US.freezeAccount)
userRouter.delete("/unfreezeAccount/:userId",Authentecation(),Validation(freezeAccountSchima),US.unfreezeAccount)
userRouter.delete("/deleteUser/:userId",Authentecation(),Validation(freezeAccountSchima),US.deleteUser)
// userRouter.post("/addFriend/:frindId",Authentecation(),US.addFriend)
// userRouter.post("/acceptFriend/:sender",Authentecation(),US.acceptFriend)






export default userRouter