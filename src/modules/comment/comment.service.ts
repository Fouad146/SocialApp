import { Response, Request, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import {
  AllowCommentEnum,
  AvelabeltyEnum,
  IComment,
  IPost,
  onModelEnum,
  postModel,
  PostRepo,
  userModel,
  UserRepo,
} from "../../DB/index";
import { CommentRepo, commentModel } from "../../DB";
import { AppErorr, deleteManyFiles, uploadFiles } from "../../utils";
import { HydratedDocument, Types } from "mongoose";
import { AvailabeletyPost } from "../post/post.service.js";

class commentService {
  private _userModel = new UserRepo(userModel);
  private _commentModel = new CommentRepo(commentModel);
  private _postModel = new PostRepo(postModel);
  constructor() {}
  creatcomment = async (req: Request, res: Response, next: NextFunction) => {
    const { postId, commentId } = req.params;
    let { content, tags, attachments, onModel } = req.body;
    let doc: HydratedDocument<IPost | IComment> | null = null;

    if (onModel !== onModelEnum.Comment) {
      if (!commentId) {
        throw new AppErorr("commentId is requierd ", 404);
      }
      const comment = await this._commentModel.findOne(
        { _id: commentId, refId: postId },
        undefined,
        {
          populate: {
            path: "refId",
            match: {
              allowComment: AllowCommentEnum.Allow,
              $or: AvailabeletyPost(req),
            },
          },
        }
      );
      if (!comment?.refId) {
        throw new AppErorr("comment not found or u are not auth");
      }
      doc = comment;
    } else if (onModel === onModelEnum.Post) {
      if (commentId) {
        throw new AppErorr("commentId is not allowed ", 404);
      }

      const post = await this._postModel.findOne({
        _id: postId,
        allawComment: AllowCommentEnum.Allow,
        $or: AvailabeletyPost(req),
      });
      if (!post) {
        throw new AppErorr("post not found or u are not auth");
      }
      doc = post;
    }
    if (tags?.length) {
      const count = await this._userModel.countDocuments({
        _id: { $in: tags },
      });

      if (count !== tags.length) {
        throw new AppErorr("invalid userId", 409);
      }
    }

    const assetFolderId = uuidv4();
    if (attachments?.length) {
      attachments = await uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${doc?.createdBy}/posts/${doc?.assetFolderId}/comments/${assetFolderId}`,
      });
    }
    const comment = await this._commentModel.Create({
      content,
      attachments,
      tags,
      assetFolderId,
      refId: postId as unknown as Types.ObjectId,
      onModel,
      createdBy: req.user?._id as unknown as Types.ObjectId,
    });
    if (!comment) {
      await deleteManyFiles({ urls: attachments || [] });
    }

    return res.status(201).json({ message: "succiss", comment });
  };

  //////////////////////////////////////////////////////////////////////////////////////
}
export default new commentService();
