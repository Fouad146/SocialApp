import { Types } from "mongoose";
import z, { email } from "zod";



export const GeneralRules ={
    id:z.string().refine((value)=>{
        return Types.ObjectId.isValid(value)
    },{message:"Invaled userId"}),
    email:z.email(),
    file:z.object({ fieldname: z.string(),
      originalname: z.string(),
      encoding: z.string(),
      mimetype:z.string(),
      buffer: z.instanceof(Buffer).optional(),
      path:z.string(),
      size: z.number()}
    )
}