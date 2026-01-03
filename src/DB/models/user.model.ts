import { populate } from "dotenv";
import { model, ObjectId, Schema, models, Types } from "mongoose";
import autopopulate from "mongoose-autopopulate";

export enum genderType {
  Male = "male",
  Female = "female",
}
export enum roleType {
  User = "uesr",
  Admin = "admin",
  Developer = "developer",
}
export enum providerType {
  system = "system",
  google = "google",
}

export interface IUesr {
  _id?: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  age: number;

  profileImage?: string;
  tempProfileImage?: string;
  coverImage?: string;
  tempCoverImage?: string;
  phone?: string;
  gender?: genderType;
  role?: roleType;
  createdAt?: Date;
  updatedAt?: Date;
  userName?: string;
  provider?: providerType;
  otp?:string
  confermed:boolean
  chengeCredentiles?:Date
  deletedAt?:Date
  deletedBy?:Schema.Types.ObjectId
  restoredAt?:Date
  restoredBy?:Schema.Types.ObjectId
  friends?:Types.ObjectId[]
  // friendRequest?:Types.ObjectId[]
  // pindingFriendRequest?:Types.ObjectId[]
  
}

const userSchema = new Schema<IUesr>(
  {
    firstName: { type: String, minlength: 2, maxLength: 15 },
    lastName: { type: String, minlength: 2, maxLength: 15 },
    email: { type: String, unique: true },
    password: {
      type: String,
      required: function ():boolean {
        return this.provider === providerType.system?true:false;
      },
    },
    provider: {
      type: String,
      enum: providerType,
      default: providerType.system,
    },
    age: { type: Number, min: 18, max: 60 },
    profileImage: { type: String },
    tempProfileImage: { type: String },
    coverImage: { type: String },
    tempCoverImage: { type: String },
    phone: { type: String },
    gender: { type: String, enum: genderType, default: genderType.Male },
    role: { type: String, enum: roleType, default: roleType.User },
    otp:{type:String},
    confermed:{type:Boolean,default:false},
    chengeCredentiles:{type:Date},
      deletedAt:{type:Date},
      deletedBy:{type:Types.ObjectId},
      restoredAt:{type:Date},
      restoredBy:{type:Types.ObjectId},
      friends:[{type:Schema.Types.ObjectId ,ref:"User",autopopulate:true}],
      // friendRequest:[{type:Schema.Types.ObjectId}],
      // pindingFriendRequest:[{type:Schema.Types.ObjectId}]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


userSchema
  .virtual("userName")
  .set(function (params) {
    const [firstName, lastName] = params.split("");
    this.set(firstName, lastName);
  })
  .get(function () {
    return this.firstName + " " + this.lastName;
  });

  userSchema.plugin(autopopulate);

userSchema.pre(["find", "findOne", "findOneAndUpdate"], function (next) {
  const query = this.getQuery();

  // Correct spelling
  const { populate, ...rest } = query;

    // If user requested populate: true → auto populate friends
  if (populate === "friends" || populate === true) {
    this.populate("friends");
  }

  next();
});


export const userModel = models.User || model("User", userSchema);
