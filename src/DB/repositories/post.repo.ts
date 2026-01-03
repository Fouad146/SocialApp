import {  Model } from "mongoose";
import { DataBaseReposatory } from "../../DB";
import { IPost } from "../models/post.model";

export class PostRepo extends DataBaseReposatory<IPost> {
  constructor(protected model: Model<IPost>) {
    super(model);
  }
}

// export default UserRepo;
