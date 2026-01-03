  import z, { object } from "zod";
import { AllowCommentEnum, AvelabeltyEnum } from "../../DB";
import { GeneralRules } from "../../utils";

export enum actionEnum{
  React = "react",
  Disreact = "disreact"
}
 
export const creatPostSchema = {
  body: z.strictObject({
      content: z.string().min(2).optional(),
      attachments: z.array(GeneralRules.file).max(2).optional(),
      assetFolderId: z.string().optional(),
      avelabelty: z.enum(AvelabeltyEnum).default(AvelabeltyEnum.Puplic).optional(),
      allowComment: z.enum(AllowCommentEnum).default(AllowCommentEnum.Allow).optional(),
      tags: z.array(GeneralRules.id).refine((data)=>{
        return new Set(data).size === data.length
      },{message:"dublecated tages"}).optional(),
    })
    .superRefine((data, ctx) => {
      if (!data.content && !data.attachments?.length) {
        ctx.addIssue({
          code: "custom",
          path: ["content"],
          message: "conte]nt is empty",
        });
      }

    }),
};
export const updatePostSchema = {
  body: z.strictObject({
      content: z.string().min(2).optional(),
      attachments: z.array(GeneralRules.file).max(2).optional(),
      assetFolderId: z.string().optional(),
      avelabelty: z.enum(AvelabeltyEnum).default(AvelabeltyEnum.Puplic).optional(),
      allowComment: z.enum(AllowCommentEnum).default(AllowCommentEnum.Allow).optional(),
      tags: z.array(GeneralRules.id).refine((data)=>{
        return new Set(data).size === data.length
      },{message:"dublecated tages"}).optional(),
    })
    .superRefine((data, ctx) => {
      if (!Object.values(data).length) {
        ctx.addIssue({
          code: "custom",
          message: "at least one field update",
        });
      }

    }),
};

export const reactPostSchema = {
  params :z.object({
    postId:GeneralRules.id
  }),
}




////////////////////////////////////////////////////////////
export type reactDto = z.infer<typeof reactPostSchema.params>
