import { Response, Request, NextFunction } from "express";
import {
  AvelabeltyEnum,
  postModel,
  PostRepo,
  userModel,
  UserRepo,
} from "../../DB/index";
import { AppErorr, deleteManyFiles, uploadFiles } from "../../utils";
import { v4 as uuidv4 } from "uuid";
import { reactDto } from "./post.validation";
import { Types } from "mongoose";

export const AvailabeletyPost = (req: Request) => {
  return [
    { avelabelty: AvelabeltyEnum.Puplic },
    { avelabelty: AvelabeltyEnum.Privet, createdBy: req.user?._id },
    {avelabelty: AvelabeltyEnum.Frinds,createdBy: { $in: [...req?.user?.friends || [], req.user?._id] }},
  ];
};

class postService {
  private _userModel = new UserRepo(userModel);
  private _postModel = new PostRepo(postModel);
  constructor() {}
  creatPost = async (req: Request, res: Response, next: NextFunction) => {
    const usersTages = await this._userModel.find({
      _id: { $in: req.body.tags },
    });

    if (req.body.tags && usersTages.length !== req.body.tags.length) {
      throw new AppErorr("invaled user id", 400);
    }
    const assetFolderId = uuidv4();
    let attachments: string[] = [];

    if (req?.files?.length!) {
      attachments = await uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${req.user?._id}/posts/${assetFolderId}`,
      });
    }

    const post = await this._postModel.Create({
      ...req.body,
      attachments,
      assetFolderId,
      createdBy: req.user?._id,
    });
    if (!post) {
      await deleteManyFiles({ urls: attachments || [] });
      throw new AppErorr("invaled user id", 400);
    }
    return res.status(201).json({ message: "succiss", post });
  };

  reactPost = async (req: Request, res: Response, next: NextFunction) => {
    const { postId }: reactDto = req.params as unknown as reactDto;
    const post = await this._postModel.findOne({ _id: postId });
    if (!post) {
      throw new AppErorr("Cann`t find Post", 400);
    }
    let action = "";
    if (
      post?.reacts.some((id: Types.ObjectId) => id.equals(req?.user?._id!)) ??
      false
    ) {
      await this._postModel.Update(
        { _id: postId },
        { $pull: { reacts: req.user?._id } }
      );
      action = "disReact";
    } else {
      await this._postModel.Update(
        {
          _id: postId,
          $or: [
            { avelabelty: AvelabeltyEnum.Puplic },
            { avelabelty: AvelabeltyEnum.Privet, createdBy: req.user?._id },
            {
              avelabelty: AvelabeltyEnum.Frinds,
              createdBy: { $in: [...(req.user?.friends || []), req.user?._id] },
            },
          ],
        },
        { $addToSet: { reacts: req.user?._id } }
      );
      action = "React";
    }

    return res.status(201).json({ message: "succiss", action });
  };
  updatePost = async (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.params;
    const post = await this._postModel.findOne({
      _id: postId,
      createdBy: req.user?._id,
    });
    if (!post) {
      throw new AppErorr("failed to update post or auth", 409);
    }
    if (req.body?.content) {
      post.content === req.body?.content;
    }
    if (req.body?.tags?.length) {
      if (
        (await this._userModel.find({ _id: { $in: req.body.tags } })).length !==
        req.body.tags.length
      ) {
        throw new AppErorr("invalid userId", 409);
      }
      post.tags === req.body?.tags;
    }
    if (req.body?.avelabelty) {
      post.avelabelty === req.body?.avelabelty;
    }
    if (req.body?.allowComment) {
      post.allowComment === req.body?.allowComment;
    }
    if (req.files?.length) {
      await deleteManyFiles({ urls: post.attachments || [] });
      post.attachments = await uploadFiles({
        files: req.files as unknown as Express.Multer.File[],
        path: `users/${req.user?._id}/posts/${post.assetFolderId}`,
      });
    }
    await post.save();
    return res.status(201).json({ message: "succiss", post });
  };
  getPosts = async (req: Request, res: Response, next: NextFunction) => {
    let {page = 1,limit = 5}=req.query as unknown as {page:number,limit:number}
    const { numberOfPages,currentPage,countDocuments,docs}= await this._postModel.pagenation({filter:{},quiry:{page,limit},options:{populate:[{path:"Comments",match:{commentId:{$exist:false}},populate:[{path:"replies"}]}]}})
    return res.status(201).json({ message: "succiss",numberOfPages,currentPage,countDocuments,docs });
  };

  //////////////////////////////////////////////////////////////////////////////////////
}
export default new postService();
