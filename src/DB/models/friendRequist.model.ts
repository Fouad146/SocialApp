import { model, Schema, models, Types } from "mongoose";

export interface IFriendRequist {

  sendedBy: Types.ObjectId;
  sendedto: Types.ObjectId;

  acceptedAt?: Date;

}


const friendRequistSchema = new Schema<IFriendRequist>( {

    sendedBy: { type: Schema.Types.ObjectId,ref:"User"},
    sendedto: { type: Schema.Types.ObjectId,ref:"User"},
    acceptedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strictQuery:true
  }
);

friendRequistSchema.pre(["findOne","find","findOneAndUpdate"],function (next) {
const query = this.getQuery()
const {paranoid,...rest}=query
if(paranoid == false){
 this.setQuery({...rest})
}else{
  this.setQuery({...rest,deletedAt:{$exists:false}})

}
  next()
})


export const friendRequistModel = models.FriendRequist || model("FriendRequist", friendRequistSchema);
