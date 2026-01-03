import {  Model } from "mongoose";
import { DataBaseReposatory } from "..";
import { IChat } from "../models/chat.model";

export class ChatRepo extends DataBaseReposatory<IChat> {
  constructor(protected model: Model<IChat>) {
    super(model);
  }
}

// export default UserRepo;
