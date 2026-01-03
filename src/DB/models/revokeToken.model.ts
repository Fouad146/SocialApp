import { model, ObjectId, Schema, models, Types } from "mongoose";

export interface IRevokeToken {
  userId: Types.ObjectId;
  tokenId: string;
  expireAt: Date;
}
export enum flagType {
  All = "all",
  Currntly = "currntly"
}

const revokeTokenSchema = new Schema<IRevokeToken>(
  {
    userId: {type:Schema.Types.ObjectId,ref:"User"},
    tokenId: {type:String},
    expireAt: {type:Date},
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const revokeTokenModel =
  models.RevokeToken || model("RevokeToken", revokeTokenSchema);
