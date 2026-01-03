import { HydratedDocument } from "mongoose";
import { IUesr } from "../DB/models/user.model.js";
import { JwtPayload } from "jsonwebtoken";

// export interface RequestType extends Request {
//     user : HydratedDocument<IUesr>,
//     decoded : JwtPayload
// }
declare module "express-serve-static-core"{
    interface Request {
    user? : HydratedDocument<IUesr>,
    decoded? : JwtPayload|string
}

}
