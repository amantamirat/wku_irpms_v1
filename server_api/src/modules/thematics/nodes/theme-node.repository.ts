import mongoose from "mongoose";
import { IThemeNode, ThemeNode } from "./theme-node.model";
import { CreateNodeDTO, GetNodeDTO, UpdateNodeDTO } from "./theme-node.dto";


export interface IThemeNodeRepository {
  findById(id: string): Promise<IThemeNode | null>;
  find(filters: GetNodeDTO, populate?: boolean): Promise<Partial<IThemeNode>[]>;
  create(data: CreateNodeDTO): Promise<IThemeNode>;
  update(id: string, data: UpdateNodeDTO["data"]): Promise<IThemeNode>;
  delete(id: string): Promise<IThemeNode | null>;
}

export class ThemeNodeRepository implements IThemeNodeRepository {

  async findById(id: string): Promise<IThemeNode | null> {
    return ThemeNode.findById(new mongoose.Types.ObjectId(id))
      .lean<IThemeNode>()
      .exec();
  }

  async find(filters: GetNodeDTO, populate: boolean = true) {
    const query: any = {};
    if (filters.parent) {
      query.parent = new mongoose.Types.ObjectId(filters.parent);
    }
    else {
      query.isRoot = true;
    }
    if (populate === false) {
      return ThemeNode.find(query)
        .lean<IThemeNode[]>()
        .exec();
    }
    return ThemeNode.find(query)
      .populate("parent")
      .lean<IThemeNode[]>()
      .exec();
  }

  async create(dto: CreateNodeDTO): Promise<IThemeNode> {
    const data: any = { name: dto.name }
    if (dto.parent) {
      data.parent = new mongoose.Types.ObjectId(dto.parent);
      data.isRoot = false;
    }
    else {
      data.isRoot = true;
    }
    return ThemeNode.create(data);
  }

  async update(id: string, dtoData: UpdateNodeDTO["data"]): Promise<IThemeNode> {
    const toUpdate: any = {};

    if (dtoData.name) {
      toUpdate.name = dtoData.name;
    }

    const updated = await ThemeNode.findByIdAndUpdate(
      new mongoose.Types.ObjectId(id),
      { $set: toUpdate },
      { new: true }
    ).lean<IThemeNode>();

    if (!updated) {
      throw new Error("ThemeNode not found.");
    }

    return updated;
  }

  async delete(id: string): Promise<IThemeNode | null> {
    return ThemeNode.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
  }

}