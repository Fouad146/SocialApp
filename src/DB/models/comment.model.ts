import { model, Schema, models, Types } from "mongoose";

export interface IComment {
  content?: String;
  attachments?: string[];
  assetFolderId?: String;
  refId:Types.ObjectId

  createdBy: Types.ObjectId;
  tags: Types.ObjectId[];
  reacts: Types.ObjectId[];


  onModel :onModelEnum
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  restoredAt?: Date;
  restoredBy?: Types.ObjectId;
}

export enum onModelEnum{
  Post = "Post",
  Comment = "Comment"
}

const commentSchema = new Schema<IComment>(
  {
    content: { type: String,minLength:1,required:function () {
      return this.attachments?.length === 0
    } },
    attachments: [ String] ,
    assetFolderId: { type: String },
    refId: { type: Schema.Types.ObjectId,refPath:"onModel" },

    createdBy: { type: Schema.Types.ObjectId,ref:"User"},
    tags: [{ type: Schema.Types.ObjectId ,ref:"User"}],
    reacts: [{ type: Schema.Types.ObjectId ,ref:"User"}],

    onModel:{type:String,enum:onModelEnum,required:true},
    deletedAt: { type: Date },
    deletedBy: { type: Types.ObjectId,ref:"User" },
    restoredAt: { type: Date },
    restoredBy: { type: Types.ObjectId,ref:"User" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strictQuery:true
  }
);

commentSchema.pre(["findOne","find","findOneAndUpdate"],function (next) {
const query = this.getQuery()
const {paranoid,...rest}=query
if(paranoid == false){
 this.setQuery({...rest})
}else{
  this.setQuery({...rest,deletedAt:{$exists:false}})

}
  next()
})
commentSchema.virtual("replies",{
  ref:"Comment",
  localField:"_id",
  foreignField:"commentId"
})


export const commentModel = models.Comment || model("Comment", commentSchema);
