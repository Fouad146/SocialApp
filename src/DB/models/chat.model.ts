import { model, models, Schema, Types } from "mongoose";

export interface IMessage{
    content:string;
    createdBy:Types.ObjectId;

    createdAt?:Date;
    updatedAt?:Date;
}
export interface IChat{
    participants:Types.ObjectId[];
    createdBy:Types.ObjectId;
    sendTo:Schema.Types.ObjectId;

    readBy:Types.ObjectId[];
    
    messages:IMessage[];

    group?:string
    groupImage?:string;
    groupId?:string
    roomId?:string;
    
    createdAt?:Date;
    updatedAt?:Date;
}
export const MessageSchema=new Schema<IMessage>({
    content:{type:String,required:true},
    createdBy:{type:Schema.Types.ObjectId,ref:"User",required:true},
},{
    timestamps:true
});
export const ChatSchema=new Schema<IChat>({
    participants:[{type:Schema.Types.ObjectId,ref:"User",required:true}],
    createdBy:{type:Schema.Types.ObjectId,ref:"User",required:true},
    sendTo:{type:Types.ObjectId,ref:"User",required:true},
    readBy:[{type:Schema.Types.ObjectId,ref:"User",default:[]}],
    messages: [MessageSchema],
    group:{type:String,default:null},
    groupImage:{type:String,default:null},
    groupId:{type:String,default:null},
    createdAt:{type:Date,default:Date.now()},
    updatedAt:{type:Date,default:Date.now()},
    roomId:{type:String,default:null}
},{
    timestamps:true
});


export const ChatModel=models.Chat||model<IChat>("Chat",ChatSchema);