import { JwtPayload } from "jsonwebtoken"
import { HydratedDocument } from "mongoose"
import { Socket } from "socket.io"
import { IUesr } from "../../DB"

export interface SokecketWithuser extends Socket{
    user?:Partial<HydratedDocument<IUesr>>
    decoded?:JwtPayload
} 

