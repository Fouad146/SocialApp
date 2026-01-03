import { Model } from "mongoose";
import { DataBaseReposatory } from "../../DB";
import { IRevokeToken } from "../models/revokeToken.model";

export class RevokeTokenRepo extends DataBaseReposatory<IRevokeToken> {
  constructor(protected model: Model<IRevokeToken>) {
    super(model);
  }
}

// export default UserRepo;
