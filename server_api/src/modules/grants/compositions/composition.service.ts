import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { IGrantRepository, GrantRepository } from "../grant.repository";
import { CreateCompositionDTO, GetCompositionDTO, UpdateCompositionDTO } from "./composition.dto";
import { ICompositionRepository, CompositionRepository } from "./composition.repository";


export class CompositionService {
  constructor(
    private readonly compositionRepo: ICompositionRepository = new CompositionRepository(),
    private readonly grantRepo: IGrantRepository = new GrantRepository()
  ) { }

  // ✅ Create
  async create(dto: CreateCompositionDTO) {
    const { grant } = dto;

    const grantDoc = await this.grantRepo.findById(grant);
    if (!grantDoc) {
      throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);
    }

    try {
      return await this.compositionRepo.create(dto);
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new AppError(ERROR_CODES.PI_ALREADY_EXISTS_FOR_GRANT);
      }
      throw err;
    }
  }

  // ✅ Get (filter by grant, optional populate)
  async getCompositions(options: GetCompositionDTO) {
    return await this.compositionRepo.find(options);
  }

  // ✅ Update
  async update(dto: UpdateCompositionDTO) {
    const { id, data } = dto;

    const updated = await this.compositionRepo.update(id, data);

    if (!updated) {
      throw new AppError(ERROR_CODES.COMPOSITION_NOT_FOUND);
    }

    return updated;
  }

  // ✅ Delete
  async delete(id: string) {
    const deleted = await this.compositionRepo.delete(id);

    if (!deleted) {
      throw new AppError(ERROR_CODES.COMPOSITION_NOT_FOUND);
    }

    return deleted;
  }
}
