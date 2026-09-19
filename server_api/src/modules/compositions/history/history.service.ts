import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { isValidRange } from "../../../common/types/range";
import { CreateHistoryDTO, UpdateHistoryDTO } from "./history.dto";
import { HistoryRepository } from "./history.repository";
import { IHistoryRule } from "./history.model";


export class HistoryService {

    constructor(
        private readonly repository: HistoryRepository
    ) { }


    async create(
        dto: CreateHistoryDTO
    ): Promise<IHistoryRule> {

        const exists = await this.repository.findByName(
            dto.name
        );

        if (exists) {
            throw new AppError(
                ERROR_CODES.DUPLICATE_ENTRY,
                "History name already exists."
            );
        }

        this.validateRanges(dto);

        return await this.repository.create(dto);
    }


    async findById(
        id: string
    ): Promise<IHistoryRule | null> {

        return await this.repository.findById(id);
    }


    async findAll(): Promise<IHistoryRule[]> {

        return await this.repository.findAll();
    }


    async update(
        dto: UpdateHistoryDTO
    ): Promise<IHistoryRule | null> {

        const { id, data } = dto;

        const history =
            await this.repository.findById(id);

        if (!history) {
            throw new AppError(
                ERROR_CODES.PROFILE_NOT_FOUND
            );
        }

        if (data.name) {

            const exists =
                await this.repository.findByName(
                    data.name,
                    id
                );

            if (exists) {
                throw new AppError(
                    ERROR_CODES.DUPLICATE_ENTRY,
                    "History name already exists."
                );
            }
        }

        this.validateRanges(data);

        return await this.repository.update(
            id,
            data
        );
    }


    async delete(
        id: string
    ): Promise<IHistoryRule | null> {

        const history =
            await this.repository.delete(id);

        if (!history) {
            throw new AppError(
                ERROR_CODES.PROFILE_NOT_FOUND
            );
        }

        return history;
    }


    private validateRanges(
        dto: Partial<CreateHistoryDTO>
    ): void {

        const ranges = [
            ["Project granted", dto.project?.granted],
            ["Project refused", dto.project?.refused],
            ["Project completed", dto.project?.completed],

            ["Application submitted", dto.application?.submitted],
            ["Application accepted", dto.application?.accepted],
            ["Application rejected", dto.application?.rejected],
        ] as const;

        for (const [name, range] of ranges) {

            if (!range) {
                continue;
            }

            if (!isValidRange(range)) {
                throw new AppError(
                    ERROR_CODES.INVALID_INPUT,
                    `${name} range is invalid.`
                );
            }
        }
    }
}