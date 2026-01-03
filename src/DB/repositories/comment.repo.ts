import {  Model } from "mongoose";
import { DataBaseReposatory } from "..";
import { IComment } from "../models/comment.model";

export class CommentRepo extends DataBaseReposatory<IComment> {
  constructor(protected model: Model<IComment>) {
    super(model);
  }
}

// export default UserRepo;
