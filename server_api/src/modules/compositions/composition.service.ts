import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { UpdateCompositionDTO } from "./composition.dto";
import { CompositionRepository } from "./composition.repository";


export class CompositionService {

  constructor(private readonly repository: CompositionRepository) { }


  async create(data: any) {
    return this.repository.create(data);
  }

  async findAll() {
    return this.repository.findAll();
  }

  async getById(id: string) {
    const composition = await this.repository.findById(id);
    if (!composition) {
      throw new AppError(
        ERROR_CODES.COMPOSITION_NOT_FOUND
      );
    }
    return composition;
  }

  async update(dto: UpdateCompositionDTO) {
    const { id, data } = dto;
    const composition = await this.repository.findById(id);
    if (!composition) {
      throw new AppError(
        ERROR_CODES.COMPOSITION_NOT_FOUND
      );
    }

    const updated = await this.repository.update(id, data);

    return updated;

  }


  async delete(id: string) {

    const composition =
      await this.repository.delete(id);


    if (!composition) {
      throw new AppError(
        ERROR_CODES.COMPOSITION_NOT_FOUND
      );
    }
    return composition;
  }

}


