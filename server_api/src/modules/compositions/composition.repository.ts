import { FilterOptions } from "../../common/dtos/filter.dto";
import { Composition, IComposition } from "./composition.model";

export class CompositionRepository {

  private populateComposition(query: any) {
    return query
      .populate("leadRule")
      .populate("memberRules")
  }

  async create(data: Partial<IComposition> | any) {
    const composition = await Composition.create(data);
    return composition;
  }

  async findAll(options?: FilterOptions) {
    let dbQuery = Composition.find();

    if (options?.populate) {
      dbQuery = this.populateComposition(dbQuery);
    }

    return dbQuery.sort({ createdAt: -1 });
  }

  async findById(id: string, options?: FilterOptions) {
    let query = Composition.findById(id);

    if (options?.populate) {
      query = this.populateComposition(query);
    }

    return query;
  }

  async update(
    id: string,
    data: Partial<IComposition> | any,
    options?: FilterOptions
  ) {
    let query = Composition.findByIdAndUpdate(
      id,
      data,
      {
        new: true
      }
    );

    if (options?.populate) {
      query = this.populateComposition(query);
    }

    return query;
  }

  async delete(id: string) {
    return Composition.findByIdAndDelete(id);
  }
}