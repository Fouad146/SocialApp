import { Server, Socket } from "socket.io";
import { Response, Request, NextFunction } from "express";
import { ChatRepo, ChatModel, UserRepo, userModel } from "../../DB";
import { AppErorr } from "../../utils/globelErorr";
import { SokecketWithuser } from "../gateway/getway.interface";
import { connectionSockets } from "../gateway/gateway";
import { Types } from "mongoose";
import { uploadFile } from "../../utils/s3.config";
import { v4 as uuidv4 } from "uuid";

export class ChateService {
  constructor() {}
  private _chatModel = new ChatRepo(ChatModel);
  private _userModel = new UserRepo(userModel);
  //////////////////////rest api
  getChat = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const chat = await this._chatModel.findOne(
      { participants: { $all: [req.user?._id, userId] } },
      {messages:{$slice:[-5,5]}},
      { populate: [{ path: "participants" }] }
    );
    // if (!chat) {
    //     throw new AppErorr("user haven`t chat")
    // }

    return res.status(200).json({
      success: true,
      message: chat ? "Chat retrieved successfully" : "No chat found",
      data: { chat: chat || null },
    });
};
creatGroup = async (req: Request, res: Response, next: NextFunction) => {
let {group,groupImage,participants} = req.body;
const createdBy =req.user?._id! as Types.ObjectId;
const dbParticipants=participants.map((participants:string)=>Types.ObjectId.createFromHexString(participants) )
const users=await this._userModel.find({_id:{$in:dbParticipants},friends:{$in:[createdBy!]}})
if (users.length!==participants.length) {
    throw new AppErorr("one or more users are not your friends",403)
}
const roomId = group.replaceAll(/\s+/g, '_') + '_' + uuidv4();
if (req.file) {
    groupImage = await uploadFile({path:`chat/${roomId}`,file:req.file as Express.Multer.File})
}
dbParticipants.push(createdBy)
const chat = await this._chatModel.Create({
    group,groupImage,participants,createdBy,roomId,messages:[]
})
if (!chat) {

    throw new AppErorr("failed to create group chat",500)
}
return res.status(201).json({
    success:true,
    message:"group created successfully",
    chat})

}
getGroup = async (req: Request, res: Response, next: NextFunction) => {
let {groupId} = req.params;
const createdBy =req.user?._id! as Types.ObjectId;
const chat = await this._chatModel.findOne({
    _id:groupId,
    participants:{$in:[req.user?._id!]},
    group:{$exists:true}
},undefined,{populate:[{path:"messages.createdBy"}]})
if (!chat) {

    throw new AppErorr("failed to create group chat",500)
}
return res.status(201).json({
    success:true,
    message:"group created successfully",
    chat})

}
  ///////////////////////socket io

  sayHi = (data: any, socket: SokecketWithuser, io: Server) => {
    console.log(data);
    // socket.emit("sayHi", { message: "hello from BE" });
  };
  join_room =async (data: any, socket: SokecketWithuser, io: Server) => {
    console.log(data);
    const { roomId } = data;
    const chat =await this._chatModel.findOne({roomId,participants:{$in:[socket.user?._id!]},group:{$exists:true}})
    if (!chat) {
        throw new AppErorr("you are not allowed to join this room",403)
    }
    socket.join(chat?.roomId!);
    // console.log({join:chat?.roomId!});

    
    // socket.emit("sayHi", { message: "hello from BE" });
  };
  sendMessage = async (data: any, socket: SokecketWithuser, io: Server) => {
    try {
      const { content, sendTo } = data;
      const createdBy = socket?.user?._id!;
    //   console.log({ content, sendTo });
    //   console.log({ createdBy: socket?.user?._id });

      const user = await this._userModel.findOne({
        _id: createdBy,
        friends: { $in: [sendTo] },
      });
      const frind = await this._userModel.findOne({
        _id: sendTo,
        friends: { $in: [createdBy] },
      });
      console.log({ user });
      if (!user) {
        throw new AppErorr("you can`t send message to this user", 403);
      }
      const chat = await this._chatModel.findOneAndUpdate(
        { participants: [createdBy, sendTo], createdBy, sendTo },
        { $push: { messages: { content, createdBy } } },
        { new: true, upsert: true }
      );
      console.log({ chat });

      if (!chat) {
          const NewChat = await this._chatModel.Create({
              participants:[createdBy,sendTo]
              ,createdBy,sendTo,
              messages:[{content,createdBy}]
          })
          console.log({NewChat});

        }
        io.to(connectionSockets.get(createdBy.toString())!).emit("successMessage", { message: "you have new message" ,content});
        io.to(connectionSockets.get(sendTo.toString())!).emit("newMessage", { message: "you have new message" ,content ,from :socket.user?._id});
    } catch (error) {
      console.log({ error });
    }
    // socket.emit("sayHi", { message: "hello from BE" });
  };
  sendGroupMessage = async (data: any, socket: SokecketWithuser, io: Server) => {
    try {
      const { content, groupId } = data;
      const createdBy = socket?.user?._id!;
      const chat =await this._chatModel.findOneAndUpdate(
        {
          participants:{$$all:[createdBy]},group:{$exists:true}
         },{ $push: { messages: { content, createdBy } } },)


      if (!chat) {
        throw new AppErorr("you are not allowed to send message to this group",403)
      }
      io.to(connectionSockets.get(createdBy.toString())!).emit("successMessage", { message: "you have new message" ,content});
      io.to(chat?.roomId!).emit("newMessage", { message: "you have new message" ,content ,from :socket.user?._id,groupId});
    } catch (error) {
      console.log({ error });
    }
    // socket.emit("sayHi", { message: "hello from BE" });
  };
}
