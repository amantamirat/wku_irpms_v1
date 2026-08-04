import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { UpdateHistoryDTO } from "./history.dto";
import { HistoryRepository } from "./history.repository";


export class HistoryService {

    constructor(private readonly historyRepository: HistoryRepository) { }


    async create(data: any) {

        return this.historyRepository.create(data);

    }



    async getHistorys() {

        return this.historyRepository.findAll();

    }



    async getById(id: string) {

        const history =
            await this.historyRepository.findById(id);


        if (!history) {
            throw new AppError(
                ERROR_CODES.PROFILE_NOT_FOUND
            );
        }


        return history;

    }


    async update(dto: UpdateHistoryDTO) {

        const { id, data } = dto;
        const history =
            await this.historyRepository.findById(id);

        if (!history) {
            throw new AppError(
                ERROR_CODES.PROFILE_NOT_FOUND
            );
        }

        const updatedHistory = await this.historyRepository.update(
            id, data);

        return updatedHistory;

    }



    async delete(id: string) {

        const history =
            await this.historyRepository.delete(id);


        if (!history) {
            throw new AppError(
                ERROR_CODES.PROFILE_NOT_FOUND
            );
        }


        return history;

    }

}


