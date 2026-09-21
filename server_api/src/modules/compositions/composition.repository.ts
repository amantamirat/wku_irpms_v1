import { FilterOptions } from "../../common/dtos/filter.dto";
import { Composition, IComposition } from "./composition.model";

export class CompositionRepository {

  async create(data: Partial<IComposition> | any) {
    return Composition.create(data);
  }

  async findAll(options?: FilterOptions) {
    let dbQuery = Composition.find();

    if (options?.populate) {
      dbQuery
        .populate("leadProfileRule")
        .populate("leadHistoryRules.rule")
        .populate("memberRequirements");
    }

    return dbQuery.sort({ createdAt: -1 });
  }

  async findById(id: string, options?: FilterOptions) {
    let query = Composition.findById(id);
    
    if (options?.populate) {
      query = query
        .populate("leadProfileRule")
        .populate("leadHistoryRules.rule")
        .populate("memberRequirements");
    }

    return query;
  }

  async update(
    id: string,
    data: Partial<IComposition> | any
  ) {
    return Composition.findByIdAndUpdate(
      id,
      data,
      {
        new: true
      }
    );
  }

  async delete(id: string) {
    return Composition.findByIdAndDelete(id);
  }

}