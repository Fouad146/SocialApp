import {
  FilterQuery,
  HydratedDocument,
  Model,
  ProjectionType,
  QueryOptions,
  RootFilterQuery,
  UpdateQuery,
  UpdateWithAggregationPipeline,
  UpdateWriteOpResult,
} from "mongoose";
import { DataBaseReposatory } from "../../DB";
import { IUesr, userModel } from "../../DB/models/user.model.js";
import { HasLeanOption } from "mongoose";

export class UserRepo extends DataBaseReposatory<IUesr> {
  constructor(protected model: Model<IUesr>) {
    super(model);
  }
  CreateOneUser = async (
    data: Partial<IUesr>
  ): Promise<HydratedDocument<IUesr>> => {
    const user = await this.model.create(data);
    return user;
  };
  UpdateUser = async (
    filter: FilterQuery<IUesr>,
    update: UpdateQuery<IUesr>
  ): Promise<UpdateWriteOpResult> => {
    return this.model.updateOne(filter, update);
  };

  findUserAndUpdate = async (
    filter?: RootFilterQuery<IUesr>,
    update?: UpdateQuery<IUesr>,
    options?:QueryOptions<IUesr>|null 
  ):Promise< HydratedDocument<IUesr>| null> => {
    return await this.model.findOneAndUpdate(filter, update!,options={new :true});
  };
  countDocuments =async (    filter: RootFilterQuery<IUesr>,
    projection?: ProjectionType<IUesr>,
    options?: QueryOptions<IUesr>
): Promise<number> =>{
    const count = await this.model.find(filter, projection, options)
    return count.length
  }
}

// export default UserRepo;
