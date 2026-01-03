import { model, Schema, models, Types } from "mongoose";

export interface IPost {
  content?: String;
  attachments?: string[];
  assetFolderId?: String;

  createdBy: Types.ObjectId;
  tags: Types.ObjectId[];
  reacts: Types.ObjectId[];

  allowComment?: AllowCommentEnum;
  avelabelty?:AvelabeltyEnum

  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  restoredAt?: Date;
  restoredBy?: Types.ObjectId;
}
export enum AllowCommentEnum {
  Allow = "allow",
  Deny = "deny",
}
export enum AvelabeltyEnum {
  Puplic = "puplic",
  Privet = "privet",
  Frinds = "frinds",

}

const postSchema = new Schema<IPost>(
  {
    content: { type: String,minLength:1,required:function () {
      return this.attachments?.length === 0
    } },
    attachments: [ String] ,
    assetFolderId: { type: String },

    createdBy: { type: Schema.Types.ObjectId },
    tags: [{ type: Schema.Types.ObjectId ,ref:"User"}],
    reacts: [{ type: Schema.Types.ObjectId ,ref:"User"}],

    allowComment: {
      type: String,
      enum: AllowCommentEnum,
      default: AllowCommentEnum.Allow,
    },
    avelabelty: {
      type: String,
      enum: AvelabeltyEnum,
      default: AvelabeltyEnum.Puplic,
    },

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
postSchema.pre(["findOne","find"],function (next) {
const query = this.getQuery()
const {paranoid,...rest}=query
if(paranoid == false){
 this.setQuery({...rest})
}else{
  this.setQuery({...rest,deletedAt:{$exists:false}})

}
  next()
})

postSchema.virtual("Comments",{
  ref:"Comment",
  localField:"_id",
  foreignField:"postId"
})

export const postModel = models.Post || model("Post", postSchema);
