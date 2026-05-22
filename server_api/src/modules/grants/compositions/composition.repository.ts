import mongoose, { ClientSession } from "mongoose";
import { Composition, IComposition, TargetScope } from "./composition.model";

import {
  CreateCompositionDTO,
  UpdateCompositionDTO,
  GetCompositionDTO,
  ExistsCompositionDTO,
  RangeDTO
} from "./composition.dto";

export interface ICompositionRepository {
  findById(id: string): Promise<IComposition | null>;
  find(filters: GetCompositionDTO): Promise<IComposition[]>;
  findOne(grantId: string, targetScope: TargetScope): Promise<IComposition | null>;
  create(dto: CreateCompositionDTO): Promise<IComposition>;
  update(
    id: string,
    data: UpdateCompositionDTO["data"]
  ): Promise<IComposition | null>;
  exists(filters: ExistsCompositionDTO): Promise<boolean>;
  delete(id: string): Promise<IComposition | null>;
}

/* ---------------- IMPLEMENTATION ---------------- */

export class CompositionRepository implements ICompositionRepository {

  async findById(id: string) {
    return Composition.findById(new mongoose.Types.ObjectId(id))
      .populate("grant")
      .lean<IComposition>()
      .exec();
  }

  async find(filters: GetCompositionDTO) {
    const query: any = {};

    if (filters.grant) {
      query.grant = new mongoose.Types.ObjectId(filters.grant);
    }

    let dbQuery = Composition.find(query);

    if (filters.populate) {
      dbQuery = dbQuery.populate("grant");
    }

    return dbQuery.lean<IComposition[]>().exec();
  }

  async findOne(grantId: string, targetScope: TargetScope) {
    return Composition.findOne({ grant: grantId, targetScope });
  }

  async create(dto: CreateCompositionDTO) {
    const data: Partial<IComposition> = {
      grant: new mongoose.Types.ObjectId(dto.grant),
      description: dto.description,

      targetScope: dto.targetScope,

      profileRule: dto.profileRule,
      projectHistoryRule: dto.projectHistoryRule,

      mode: dto.mode,

      threshold: dto.threshold as RangeDTO,
    };

    return Composition.create(data);
  }

  async update(
    id: string,
    dtoData: UpdateCompositionDTO["data"]
  ): Promise<IComposition | null> {

    const updateData: Partial<IComposition> = {};

    if (dtoData.description !== undefined)
      updateData.description = dtoData.description;

    if (dtoData.profileRule !== undefined)
      updateData.profileRule = dtoData.profileRule;

    if (dtoData.projectHistoryRule !== undefined)
      updateData.projectHistoryRule = dtoData.projectHistoryRule;

    if (dtoData.mode !== undefined)
      updateData.mode = dtoData.mode;

    if (dtoData.threshold !== undefined)
      updateData.threshold = dtoData.threshold as RangeDTO;

    return Composition.findByIdAndUpdate(
      new mongoose.Types.ObjectId(id),
      { $set: updateData },
      { new: true }
    ).exec();
  }

  async exists(filters: ExistsCompositionDTO): Promise<boolean> {
    const query: any = {};

    if (filters.grant) {
      query.grant = new mongoose.Types.ObjectId(filters.grant);
    }

    const result = await Composition.exists(query).exec();
    return result !== null;
  }

  async delete(id: string): Promise<IComposition | null> {
    return Composition.findByIdAndDelete(
      new mongoose.Types.ObjectId(id)
    ).exec();
  }
}