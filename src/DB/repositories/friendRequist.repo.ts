import {  Model } from "mongoose";
import { DataBaseReposatory } from "..";
import { IFriendRequist } from "../models/friendRequist.model";

export class friendRequistRepo extends DataBaseReposatory<IFriendRequist> {
  constructor(protected model: Model<IFriendRequist>) {
    super(model);
  }
}

// export default UserRepo;
