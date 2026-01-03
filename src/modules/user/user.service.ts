import { Response, Request, NextFunction } from "express";
import {
  AppErorr,
  Comparing,
  eventEmitter,
  GneratToken,
  Hashing,
  VerfyToken,
  accessSignetuer,
  refreshSignetuer,
  uploadFiles,
  getFile,
  CreatGetFilePreSignUrl,
  CreatDownloadFilePreSignUrl,
  deleteOneFile,
  deleteManyFiles,
  getListOfFiles,
  CreatUploadFilePreSignedUrl,
} from "../../utils";
import { GeneratOTP } from "../../service/mailler";
import {
  freezeAccounttype,
  Otptype,
  resetPasswordPramstype,
  resetPasswordtype,
  siginUptype,
  signIntype,
  updatePasswordtype,
} from "./user.validation";
import { v4 as uuidv4 } from "uuid";
import {
  ChatModel,
  ChatRepo,
  PostRepo,
  RevokeTokenRepo,
  UserRepo,
  flagType,
  friendRequistModel,
  friendRequistRepo,
  postModel,
  providerType,
  revokeTokenModel,
  roleType,
  userModel,
} from "../../DB";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { uploadLargeFile } from "../../utils";
import { promisify } from "node:util";
import { pipeline } from "node:stream";
import { Types } from "mongoose";
const writepiprLine = promisify(pipeline);

class userService {
  private _userModel = new UserRepo(userModel);
  private _postModel = new PostRepo(postModel);
  private _revoketoken = new RevokeTokenRepo(revokeTokenModel);
  private _chatModel = new ChatRepo(ChatModel);
  private _friendRequist = new friendRequistRepo(friendRequistModel);
  constructor() {}

  //   ////////////////////////////////////  signUp ///////////////////////////////////////////////

  signUp = async (req: Request, res: Response, next: NextFunction) => {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      gender,
      age,
      phone,
    }: siginUptype = req.body;
    if (await this._userModel.findOne({ email })) {
      throw new AppErorr("user Already Exist", 404);
    }
    const OTP = await GeneratOTP();
    eventEmitter.emit("ConfermEmail", { email, OTP });

    const hashingPassword = await Hashing(password);
    const HashingOTP = await Hashing(String(OTP));

    const user = await this._userModel.CreateOneUser({
      firstName,
      lastName,
      email,
      password: hashingPassword,
      gender,
      age,
      phone,
      otp: HashingOTP,
    });

    return res.status(201).json({ message: "created sucssfully", user });
  };

  //   ////////////////////////////////////  otp ///////////////////////////////////////////////
  confermOTP = async (req: Request, res: Response, next: NextFunction) => {
    const { otp, email }: Otptype = req.body;
    const user = await this._userModel.findOne({ email });
    if (!user) {
      throw new AppErorr("User Wasn`t record in site");
    }
    if (user?.confermed) {
      return res.redirect(`${process.env.USER_BASE_URL}/signin`);
    }
    if (await Comparing(otp, String(user?.otp!))) {
      await this._userModel.UpdateUser(
        { email },
        { confermed: true, $unset: { otp: "" } }
      );
      return res.status(200).json({ message: "Correct Otp" });
    }

    return res.redirect(`${process.env.USER_BASE_URL}/signin`);
  };
  //   ////////////////////////////////////  confarmeEmailByToken ///////////////////////////////////////////////

  confermEmailWithToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { token } = req.params;
    if (!token) {
      throw new AppErorr("Your token blocked");
    }
    const decoded = await VerfyToken({
      token,
      secretOrPublicKey: process.env.CONFERMEMAIL as unknown as string,
    });
    if (!decoded || typeof decoded === "string") {
      throw new AppErorr("Invalid or expired token!", 401);
    }

    const user = await this._userModel.findOne({
      email: decoded?.email! as unknown as string,
    });

    if (!user) {
      throw new AppErorr("un fixed Token", 401);
    }
    if (!user.confermed) {
      const update = await this._userModel.UpdateUser(
        { email: user.email },
        { confermed: true, $unset: { otp: "" } }
      );

      return res.status(200).json({ message: "Confermed email", update });
    } else if (user.confermed) {
      return res.json({ message: `${process.env.USER_BASE_URL}/signin` });
    }
  };
  //   ////////////////////////////////////  Signin ///////////////////////////////////////////////

  signIn = async (req: Request, res: Response, next: NextFunction) => {
    const { password, email }: signIntype = req.body;
    const user = await this._userModel.findOne({
      email,
      provider: providerType.system,
    });
    if (!user) {
      throw new AppErorr(
        "User Wasn`t record in site or email not correct",
        404
      );
    }
    if (user.deletedAt) {
      throw new AppErorr("User is freezed", 404);
    }
    const checkPassword = await Comparing(password, user.password);
    if (!checkPassword) {
      throw new AppErorr("Uncorrect Password", 404);
    }
    if (user?.confermed == false) {
      eventEmitter.emit("ConfermEmail_2", { email });
      throw new AppErorr("Please confirm your email first", 404);
    }
    if (await this._revoketoken.findOne({ userId: user._id })) {
      await this._revoketoken.deleteMany({ userId: user._id });
    }

    // token , refresh token
    const jwtid = uuidv4();
    const AcsessToken = await GneratToken({
      payload: { id: user._id.toString(), email: user.email, role: user.role },
      secretOrPrivateKey: accessSignetuer(user) as string,
      options: { expiresIn: "3h", jwtid },
    });

    const RefreshToken = await GneratToken({
      payload: { id: user._id.toString(), email: user.email, role: user.role },
      secretOrPrivateKey: refreshSignetuer(user) as string,
      options: { expiresIn: "1y", jwtid },
    });

    return res
      .status(200)
      .json({ message: "signIn Succissfully", AcsessToken, RefreshToken });
  };
  //   ////////////////////////////////////  SigninWihtGoogle ///////////////////////////////////////////////

  loginWithGmail = async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.body;

    const client = new OAuth2Client();
    async function verify() {
      const ticket = client.verifyIdToken({
        idToken: token,
        audience: process?.env?.WEB_CLIENT_ID! as string,
      });
      const payload = (await ticket).getPayload();
      return payload;
    }
    verify().catch(console.error);

    const { email, name, picture, profile, email_verified } =
      (await verify()) as TokenPayload;

    const user = await this._userModel.findOne({ email });
    if (!user) {
      throw new AppErorr(
        "User Wasn`t record in site or email not correct",
        404
      );
    }
    if (!user) {
      const user = await this._userModel.CreateOneUser({
        userName: name!,
        email: email!,
        confermed: email_verified!,
        profileImage: picture!,
        provider: providerType.google!,
      });
    }
    if (user?.provider! === providerType.system) {
      throw new AppErorr("login with system", 404);
    }

    // token , refresh token
    const jwtid = uuidv4();
    const AcsessToken = await GneratToken({
      payload: { id: user._id.toString(), email: user.email, role: user.role },
      secretOrPrivateKey: accessSignetuer(user) as string,
      options: { expiresIn: "3h", jwtid },
    });

    const RefreshToken = await GneratToken({
      payload: { id: user._id.toString(), email: user.email, role: user.role },
      secretOrPrivateKey: refreshSignetuer(user) as string,
      options: { expiresIn: "1y", jwtid },
    });

    return res
      .status(200)
      .json({ message: "signIn Succissfully", AcsessToken, RefreshToken });
  };
  //   ////////////////////////////////////  Profile ///////////////////////////////////////////////

  profile = async (req: Request, res: Response, next: NextFunction) => {
    const user = await this._userModel.findOne(
      { _id: req.user?._id },
      undefined,
      {
        populate: [
          {
            path: "friends",
          },
        ],
      }
    );
    const groups = await this._chatModel.find({
      participants: { $in: [req.user?._id] },
      group: { $exist: true },
    });

    return res.status(200).json({
      message: "get profile Succissfully",
      user,
      groups,
      decoded: req.decoded,
    });
  };
  //   ////////////////////////////////////  refreshToken ///////////////////////////////////////////////

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    const { user, decoded } = req;
    if (!user || !decoded || typeof decoded !== "object") {
      throw new AppErorr("Bad request from token", 400);
    }
    const jwtid = uuidv4();
    const AcsessToken = await GneratToken({
      payload: {
        id: user?._id!.toString(),
        email: user?.email!,
        role: user?.role!,
      },
      secretOrPrivateKey: accessSignetuer(user) as string,
      options: { expiresIn: "3h", jwtid },
    });

    const RefreshToken = await GneratToken({
      payload: {
        id: user?._id.toString(),
        email: user?.email,
        role: user?.role,
      },
      secretOrPrivateKey: refreshSignetuer(user) as string,
      options: { expiresIn: "1y", jwtid },
    });
    await this._revoketoken.Create({
      userId: user?._id!,
      tokenId: decoded?.jti!,
      expireAt: new Date(decoded?.exp! * 1000),
    });

    return res
      .status(200)
      .json({ message: "signIn Succissfully", AcsessToken, RefreshToken });
  };

  //   ////////////////////////////////////  Logout ///////////////////////////////////////////////

  logout = async (req: Request, res: Response, next: NextFunction) => {
    const { flag } = req.body;
    const { user, decoded } = req;
    if (!user || !decoded || typeof decoded !== "object") {
      throw new AppErorr("Bad request from token", 400);
    }
    if (await this._revoketoken.findOne({ userId: decoded.id })) {
      throw new AppErorr("user loged out recently", 400);
    }

    if (flag === flagType.All) {
      await this._userModel.UpdateUser(
        { email: user?.email },
        { chengeCredentiles: new Date() }
      );
      return res
        .status(200)
        .json({ message: "user is loged out from all devices" });
    }
    await this._revoketoken.Create({
      userId: user?._id!,
      tokenId: decoded?.jti!,
      expireAt: new Date(decoded?.exp! * 1000),
    });

    return res.status(200).json({
      message: "log out from this device succissfully ",
      user,
      decoded,
    });
  };
  //   ////////////////////////////////////  forgetPassword ///////////////////////////////////////////////

  forgetPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    if (!(await this._userModel.findOne({ email, confermed: true }))) {
      throw new AppErorr("un correct email or un confermed", 400);
    }
    const otp = await GeneratOTP();
    const token = await GneratToken({
      payload: { email, otp },
      secretOrPrivateKey: process.env.RESETPASSWORD_SIGNETUER as string,
      options: { expiresIn: "1h" },
    });
    const otpHash = await Hashing(String(otp));
    eventEmitter.emit("resetPassword", { email, otp });
    await this._userModel.UpdateUser({ email }, { $set: { otp: otpHash } });
    const refreshLink = `${process.env.USER_BASE_URL}/resetPassword/${token}`;
    return res
      .status(200)
      .json({ message: "succiss send otp" })
      .redirect(refreshLink);
    // return res.redirect(`${process.env.USER_BASE_URL}/resetPassword/${token}`);
  };
  //   ////////////////////////////////////  resetPassword ///////////////////////////////////////////////

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { token }: resetPasswordPramstype =
      req.params as resetPasswordPramstype;
    const { email, otp, newPassword, confirmPassword }: resetPasswordtype =
      req.body;
    let userEmail = "";
    let userOtp = "";
    if (token) {
      const decoded = await VerfyToken({
        token: token as string,
        secretOrPublicKey: process.env.RESETPASSWORD_SIGNETUER as string,
      });
      if (!decoded || typeof decoded !== "object") {
        throw new AppErorr("fail to verfy token", 409);
      }
      userEmail = decoded?.email!;
      userOtp = decoded?.otp!;
    } else {
      userEmail = email;
      userOtp = otp;
    }
    const user = await this._userModel.findOne({
      email: userEmail,
    });
    if (!user) {
      throw new AppErorr("fail to find user", 409);
    }
    if (await Comparing(user?.otp!, userOtp)) {
      throw new AppErorr("un correct otp", 409);
    }

    const Hash = await Hashing(newPassword);
    const update = await this._userModel.findUserAndUpdate(
      { email: userEmail },
      { password: Hash, $unset: { otp: "" }, chengeCredentiles: new Date() }
    );
    const jwtid = uuidv4();
    const AcsessToken = await GneratToken({
      payload: {
        id: user?._id!.toString(),
        email: user?.email!,
        role: user?.role!,
      },
      secretOrPrivateKey: accessSignetuer(user) as string,
      options: { expiresIn: "3h", jwtid },
    });

    const RefreshToken = await GneratToken({
      payload: {
        id: user?._id.toString(),
        email: user?.email,
        role: user?.role,
      },
      secretOrPrivateKey: refreshSignetuer(user) as string,
      options: { expiresIn: "1y", jwtid },
    });

    return res.status(200).json({
      message: "Reset password successfully go to signin",
    });
  };
  //   ////////////////////////////////////  updatePassword ///////////////////////////////////////////////

  updatePassword = async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req;
    const { lastPassword, newPassword, confirmPassword }: updatePasswordtype =
      req.body;

    if (!(await Comparing(lastPassword, user?.password!))) {
      throw new AppErorr(
        "that isn`t your password,Are you forget your password?",
        409
      );
    }

    if (await Comparing(newPassword, user?.password!)) {
      throw new AppErorr("that is already your password", 409);
    }

    const Hash = await Hashing(newPassword);
    const update = await this._userModel.findUserAndUpdate(
      { email: user?.email! },
      { password: Hash, chengeCredentiles: new Date() }
    );
    if (!update) {
      throw new AppErorr("fail to update", 409);
    }

    const jwtid = uuidv4();
    const AcsessToken = await GneratToken({
      payload: {
        id: user?._id!.toString(),
        email: user?.email!,
        role: user?.role!,
      },
      secretOrPrivateKey: accessSignetuer(user!) as string,
      options: { expiresIn: "3h", jwtid },
    });

    const RefreshToken = await GneratToken({
      payload: {
        id: user?._id.toString(),
        email: user?.email,
        role: user?.role,
      },
      secretOrPrivateKey: refreshSignetuer(user!) as string,
      options: { expiresIn: "1y", jwtid },
    });

    return res.status(200).json({
      message: "updated password successfully go to signin",
      AcsessToken,
      RefreshToken,
      update,
    });
  };

  //   //////////////////////////////////// multer///////////////////////////////////////////////
  //   //////////////////////////////////// uploadProfileImage///////////////////////////////////////////////
  uploadProfileImage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user?._id) {
      throw new AppErorr("Unauthorized", 404);
    }
    const { ContentType, originalname } = req.body;
    const { Url, Key } = await CreatUploadFilePreSignedUrl({
      path: `users/${req.user._id}/profile_image`,
      ContentType,
      originalname,
      // storeType:StoreEnum.Disktop
    });
    const user = await this._userModel.findUserAndUpdate(
      {
        _id: req.user._id,
      },
      { profileImage: Key, tempProfileImage: req.user?.profileImage }
    );
    if (!user) {
      throw new AppErorr("user not found", 404);
    }
    eventEmitter.emit("UploadProfileImage", {
      userId: req.user?._id!,
      oldKey: req.user.profileImage,
      Key,
      expireIn: 30,
    });

    return res.status(200).json({
      message: "Upload successfully",
      Key,
      Url,
      user,
    });
  };
  //   //////////////////////////////////// uploadCaverImage///////////////////////////////////////////////
  uploadCaverImage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.file) {
      throw new AppErorr("No file uploaded", 404);
    }

    if (!req.user?._id) {
      throw new AppErorr("Unauthorized", 404);
    }

    const key = await uploadLargeFile({
      file: req.file,
      path: `users/${req.user._id}/cover_image`,
      // storeType:StoreEnum.Disktop
    });

    return res.status(200).json({
      message: "Upload successfully",
      imageKey: key,
    });
  };
  //   //////////////////////////////////// uploadSomePhotos///////////////////////////////////////////////
  uploadSomePhotos = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.files) {
        throw new AppErorr("No file uploaded", 404);
      }

      if (!req.user?._id) {
        throw new AppErorr("Unauthorized", 404);
      }

      const key = await uploadFiles({
        files: req?.files! as Express.Multer.File[],
        path: `users/${req.user._id}/Gallary`,
        // storeType:StoreEnum.Disktop
      });

      return res.status(200).json({
        message: "Upload successfully",
        imageKey: key,
      });
    } catch (error) {
      console.log({ error });
    }
  };
  //   //////////////////////////////////// getUploadFile///////////////////////////////////////////////
  getUploadFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { path } = req.params as unknown as { path: string[] };
      const key = path.join("/");
      const result = await getFile({
        Key: key,
      });

      const stream = result?.Body! as unknown as NodeJS.ReadStream;
      res.setHeader("Content-Type", result?.ContentType!);

      await writepiprLine(stream, res);
    } catch (error) {
      console.log({ error });
    }
  };
  //   //////////////////////////////////// dowenlodeUploadFile///////////////////////////////////////////////
  dowenlodeUploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { path } = req.params as unknown as { path: string[] };
    const { dowenloadName } = req.query;
    const key = path.join("/");
    const result = await getFile({
      Key: key,
    });

    const stream = result?.Body! as unknown as NodeJS.ReadStream;
    // res.setHeader("Content-Type",result?.ContentType!)
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${dowenloadName || key.split("/").pop()}"`
    ); // only apply it for  download
    await writepiprLine(stream, res);
  };
  //   //////////////////////////////////// creatFileUrl///////////////////////////////////////////////
  creatFileUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { path } = req.params as unknown as { path: string[] };
      const Key = path.join("/");
      const url = await CreatGetFilePreSignUrl({
        Key,
      });

      res.status(201).json({ message: "succiss", url });
    } catch (error) {
      console.log({ error });
    }
  };
  //   //////////////////////////////////// creatFileDawnloadUrl///////////////////////////////////////////////
  creatFileDawnloadUrl = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { path } = req.params as unknown as { path: string[] };
      const Key = path.join("/");
      const url = await CreatDownloadFilePreSignUrl({
        Key,
      });

      res.status(201).json({ message: "succiss", url });
    } catch (error) {
      console.log({ error });
    }
  };
  //   //////////////////////////////////// deleteFile///////////////////////////////////////////////
  deleteFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { path } = req.params as unknown as { path: string[] };
      const Key = path.join("/");
      const result = await deleteOneFile({
        Key,
      });

      res.status(201).json({ message: "succiss", result });
    } catch (error) {
      console.log({ error });
    }
  };
  //   //////////////////////////////////// deleteFiles///////////////////////////////////////////////
  deleteFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const Keys = req.body as string[];
      const result = await deleteManyFiles({
        urls: Keys,
      });

      res.status(201).json({ message: "succiss", result });
    } catch (error) {
      console.log({ error });
    }
  };
  //   //////////////////////////////////// getListFiles///////////////////////////////////////////////
  getListFiles = async (req: Request, res: Response, next: NextFunction) => {
    const { path } = req.params as unknown as { path: string[] };
    const Key = path.join("/");
    const result = await getListOfFiles({
      path: Key,
    });
    const keys = result.Contents?.map((thing) => thing.Key);

    res.status(201).json({ message: "succiss", keys }); //now can delete list
  };

  //   //////////////////////////////////// deleteFilesByPrefix///////////////////////////////////////////////
  deleteFilesByPrefix = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { path } = req.params as unknown as { path: string[] };
    const Key = path.join("/");
    const result = await getListOfFiles({
      path: Key,
    });
    const keys = result.Contents?.map((thing) => thing.Key) as string[];
    const DeletingResult = await deleteManyFiles({
      urls: keys,
    });

    res.status(201).json({ message: "succiss", DeletingResult }); //now can delete list
  };
  //   //////////////////////////////////// freezeAccount///////////////////////////////////////////////
  freezeAccount = async (req: Request, res: Response, next: NextFunction) => {
    const { userId }: freezeAccounttype = req.params as freezeAccounttype;
    if (userId && req.user?.role == roleType.User) {
      throw new AppErorr("un authorized role", 401);
    }

    const user = await this._userModel.findUserAndUpdate(
      { _id: userId || req.user?._id },
      {
        $set: {
          deletedAt: new Date(),
          deletedBy: req.user?._id,
          chengeCredentiles: new Date(),
        },
        $unset: {
          restoredAt: "",
          restoredBy: "",
        },
      }
    );

    res.status(200).json({ message: "user freezed" }); //now can delete list
  };
  //   //////////////////////////////////// unfreezeAccount///////////////////////////////////////////////
  unfreezeAccount = async (req: Request, res: Response, next: NextFunction) => {
    const { userId }: freezeAccounttype = req.params as freezeAccounttype;
    if (req.user?.role == roleType.User) {
      throw new AppErorr("un authorized role", 401);
    }

    const user = await this._userModel.findUserAndUpdate(
      { _id: userId, deletedAt: { $exists: true }, deletedBy: { $ne: userId } },
      {
        $unset: { deletedAt: "", deletedBy: "" },
        restoredAt: new Date(),
        restoredBy: req.user?._id,
      }
    );
    if (!user) {
      throw new AppErorr("user not found or u must send to admins", 401);
    }

    res.status(200).json({ message: "user unfreezed" }); //now can delete list
  };

  //   //////////////////////////////////// deleteUser///////////////////////////////////////////////
  deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    const { userId }: freezeAccounttype = req.params as freezeAccounttype;
    if (req.user?.role == roleType.User) {
      throw new AppErorr("un authorized role", 401);
    }

    const user = await this._userModel.findOneAndDelete({
      _id: userId,
      deletedAt: { $exists: true },
      deletedBy: { $ne: userId },
    });
    if (!user) {
      throw new AppErorr("user is not freeze or u must send to admins", 401);
    }

    res.status(200).json({ message: "user Deleted" }); //now can delete list
  };
  // //   //////////////////////////////////// dashboard///////////////////////////////////////////////
  // addFriend = async (req: Request, res: Response, next: NextFunction) => {
  //   const {frindId}=req.params

  //   if (!frindId || await this._userModel.findOne({_id:frindId ,deletedAt:{$exists:true}})|| new Types.ObjectId(frindId) === req.user?._id) {
  //     throw new AppErorr("uncorrect frindID or must be deleted");

  //   }
  // const user = await this._userModel.findOneAndUpdate({_id:req.user?._id},{$addToSet:{pindingFriendRequest:frindId}})
  // const friend= await this._userModel.findOneAndUpdate({_id:frindId},{$addToSet:{friendRequest:req.user?._id}})

  //   res.status(200).json({ message: "send the Friending req succissfully",userId:user?._id }); //now can delete list
  // };
  // //   //////////////////////////////////// acceptFriend///////////////////////////////////////////////
  // acceptFriend = async (req: Request, res: Response, next: NextFunction) => {
  //   const {sender}=req.params
  //     if (!sender || await this._userModel.findOne({_id:sender ,deletedAt:{$exists:true}})) {
  //     throw new AppErorr("uncorrect frindID or must be deleted");

  //   }
  // const user = await this._userModel.findOneAndUpdate({_id:req.user?._id,friendRequest:{$in:[sender]}},{$addToSet:{friends:sender},$pull:{friendRequest:sender}})
  // const friend= await this._userModel.findOneAndUpdate({_id:sender,pindingFriendRequest:{$in:[req.user?._id]}},{$addToSet:{friends:user?._id},$pull:{pindingFriendRequest:req.user?._id}})

  //   res.status(200).json({ message: "Accept the Friending req succissfully" ,user , friend}); //now can delete list
  // };
  //   //////////////////////////////////// dashboard///////////////////////////////////////////////
  dashboard = async (req: Request, res: Response, next: NextFunction) => {
    const result = await Promise.allSettled([
      this._userModel.find({}),
      this._postModel.find({}),
    ]);
    res.status(200).json({ message: "succissfully", result }); //now can delete list
  };
  //   //////////////////////////////////// updateRoleType///////////////////////////////////////////////
  updateRoleType = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const { role: newRole } = req.body;
    const denyRoles: roleType[] = [newRole, roleType.Developer];
    if (req.user?.role === roleType.Admin) {
      denyRoles.push(roleType.Admin);
      if (newRole === roleType.Developer) {
        throw new AppErorr("u don`t have outh to that");
      }
    }
    const user = await this._userModel.findOneAndUpdate(
      { _id: userId, role: { $nin: denyRoles } },
      { role: newRole },
      { new: true }
    );
    if (!user) {
      throw new AppErorr("user not found", 404);
    }
    res.status(200).json({ message: "role updated", user }); //now can delete list
  };
  //   //////////////////////////////////// friendRequist///////////////////////////////////////////////
  friendRequist = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const user = await this._userModel.findOne({ _id: userId });
    if (!user) {
      throw new AppErorr("user not found", 404);
    }
    const checkRequist = await this._friendRequist.findOne({
      sendedBy: { $in: [req?.user?._id, userId] },
      sendedto: { $in: [req.user?._id, userId] },
    });
    if (checkRequist) {
      throw new AppErorr("requist already sended", 404);
    }
    const sendRequist = await this._friendRequist.Create({
      sendedBy: req.user?._id as Types.ObjectId,
      sendedto: userId as unknown as Types.ObjectId,
    });
    if (!sendRequist) {
      throw new AppErorr("fail to send requist", 404);
    }
    res.status(200).json({ message: "role updated", sendRequist }); //now can delete list
  };
  //   //////////////////////////////////// acceptFriendRequist///////////////////////////////////////////////
  acceptFriendRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { requestId } = req.params;
    const checkRequist = await this._friendRequist.findOneAndUpdate(
      {
        _id: requestId,
        sendedto: req.user?._id,
      },
      {
        acceptedAt: new Date(),
      },
      {
        new: true,
      }
    );
    if (!checkRequist) {
      throw new AppErorr("requist notfound", 404);
    }
    await Promise.all([
      this._userModel.UpdateUser(
        { _id: checkRequist.sendedBy },
        { $push: { friends: checkRequist.sendedto } }
      ),
      this._userModel.UpdateUser(
        { _id: checkRequist.sendedto },
        { $push: { friends: checkRequist.sendedBy } }
      ),
    ]);

    res.status(200).json({ message: "role updated" }); //now can delete list
  };

  //   //////////////////////////////////// ///////////////////////////////////////////////
}
export default new userService();
