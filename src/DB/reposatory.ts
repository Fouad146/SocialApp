import { DeleteOptions } from "mongodb";
import {
  DeleteResult,
  FilterQuery,
  HydratedDocument,
  Model,
  MongooseBaseQueryOptions,
  ProjectionType,
  Query,
  QueryOptions,
  QueryWithHelpers,
  RootFilterQuery,
  UpdateQuery,
  UpdateWriteOpResult,
} from "mongoose";

export abstract class DataBaseReposatory<DocumentType> {
  constructor(protected readonly model: Model<DocumentType>) {}

  async Create(
    data: Partial<DocumentType>
  ): Promise<HydratedDocument<DocumentType>> {
    const creation = this.model.create(data);
    return creation;
  }

  async findOne(
    filter: RootFilterQuery<DocumentType>,
    projection?: ProjectionType<DocumentType>,
    options?: QueryOptions
  ): Promise<HydratedDocument<DocumentType> | null> {
    return this.model.findOne(filter, projection, options);
  }

  async find(
    filter: RootFilterQuery<DocumentType>,
    projection?: ProjectionType<DocumentType>,
    options?: QueryOptions<DocumentType>
  ): Promise<HydratedDocument<DocumentType>[]> {
    return this.model.find(filter, projection, options);
  }

  async delete(
    filter?: RootFilterQuery<DocumentType>,
    options?:
      | ((DeleteOptions & MongooseBaseQueryOptions<DocumentType>) | null)
      | null
  ): Promise<DeleteResult> {
    return await this.model.deleteOne(filter, options);
  }
  async deleteMany(
    filter?: RootFilterQuery<DocumentType>,
    options?:
      | ((DeleteOptions & MongooseBaseQueryOptions<DocumentType>) | null)
      | null
  ): Promise<DeleteResult> {
    return await this.model.deleteMany(filter, options);
  }
  async findOneAndDelete(
    filter?: RootFilterQuery<DocumentType> | null,
    options?: QueryOptions<DocumentType> | null
  ): Promise<DeleteResult | null> {
    return await this.model.findOneAndDelete(filter, options);
  }

  async findOneAndUpdate(
    filter?: RootFilterQuery<DocumentType>,
    update?: UpdateQuery<DocumentType>,
    options?: QueryOptions<DocumentType> | null
  ): Promise<HydratedDocument<DocumentType> | null> {
    return await this.model.findOneAndUpdate(
      filter,
      update!,
      (options = { new: true })
    );
  }
  Update = async (
    filter: FilterQuery<DocumentType>,
    update: UpdateQuery<DocumentType>
  ): Promise<UpdateWriteOpResult> => {
    return this.model.updateOne(filter, update);
  };
  async pagenation({
    filter,
    quiry,
    projection,
    options,
  }: {
    filter: RootFilterQuery<DocumentType>;
    quiry: { page: number; limit: number };
    projection?: ProjectionType<DocumentType>;
    options?: QueryOptions<DocumentType>;
  }){
    let { page, limit } = quiry;
    if (page > 0) page = 1;
    page = page * 1 || 1;
    const skip = (page - 1) * limit;
    const finalOptions = {
      ...options,
      skip,
      limit,
    };
    const count = await this.model.countDocuments({deletedAt: { $exists: false }});
    const numberOfPages =Math.ceil(count/page)
    const docs = await this.model.find(filter, projection, finalOptions);
    return { docs, countDocuments: count, currentPage: page , numberOfPages };
  }
}
