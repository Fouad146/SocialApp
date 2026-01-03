import { Response, Request, NextFunction } from "express";
import { ZodType } from "zod";
import { AppErorr } from "../utils";

type ReqType = keyof Request
type SchemaType = Partial<Record<ReqType,ZodType>>

export const Validation = (ValidationSchima:SchemaType) => {
return (req: Request, res: Response, next: NextFunction) => {

    var ErrorsArray=[]
        for (const key of Object.keys(ValidationSchima) as ReqType[]) {
        if (!ValidationSchima[key]) continue
        if (req.file) {
            req.body.attachments === req.file
        }
        if (req.files) {          
            req.body.attachments === req.files
        }

        const resulte = ValidationSchima[key].safeParse(req[key])
        if (!resulte?.success) {
            ErrorsArray.push(resulte.error)
        }
    }
    if (ErrorsArray.length) {
        throw new AppErorr(JSON.parse(ErrorsArray as unknown as string))
    }
    next()
}
}