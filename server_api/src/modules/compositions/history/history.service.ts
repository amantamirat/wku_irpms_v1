import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { isValid } from "../../../common/types/range";
import {
    CreateHistoryDTO,
    UpdateHistoryDTO
} from "./history.dto";
import { IHistoryRule } from "./history.model";

import { HistoryRepository } from "./history.repository";

export class HistoryService {
    constructor(
        private readonly repository: HistoryRepository
    ) { }

    // ---------------------------------------------------
    // CREATE
    // ---------------------------------------------------

    async create(dto: CreateHistoryDTO): Promise<any> {
        const exists = await this.repository.findByName(dto.name);

        if (exists) {
            throw new AppError(
                ERROR_CODES.DUPLICATE_ENTRY,
                "History name already exists."
            );
        }

        this.validate(dto);

        return await this.repository.create(dto);
    }

    // ---------------------------------------------------
    // FIND BY ID
    // ---------------------------------------------------

    async findById(id: string): Promise<IHistoryRule | null> {
        return await this.repository.findById(id);
    }

    // ---------------------------------------------------
    // FIND ALL
    // ---------------------------------------------------

    async findAll(): Promise<IHistoryRule[]> {
        return await this.repository.findAll();
    }

    // ---------------------------------------------------
    // UPDATE
    // ---------------------------------------------------

    async update(
        dto: UpdateHistoryDTO
    ): Promise<IHistoryRule | null> {
        const { id, data } = dto;

        const history = await this.repository.findById(id);

        if (!history) {
            throw new AppError(
                ERROR_CODES.PROFILE_NOT_FOUND
            );
        }

        // -----------------------------------------------
        // Duplicate name check
        // -----------------------------------------------

        if (
            data.name &&
            data.name.trim() !== history.name
        ) {
            const exists = await this.repository.findByName(
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

        // -----------------------------------------------
        // Validate configuration
        // -----------------------------------------------

        this.validate(data);

        return await this.repository.update(id, data);
    }

    // ---------------------------------------------------
    // DELETE
    // ---------------------------------------------------

    async delete(
        id: string
    ): Promise<IHistoryRule | null> {
        const history = await this.repository.delete(id);

        if (!history) {
            throw new AppError(
                ERROR_CODES.PROFILE_NOT_FOUND
            );
        }

        return history;
    }

    // ---------------------------------------------------
    // VALIDATION
    // ---------------------------------------------------

    private validate(
        dto: Partial<CreateHistoryDTO>
    ): void {
        this.validateRanges(dto);
        //this.validateTotal(dto);
    }

    // ---------------------------------------------------
    // RANGE VALIDATION
    // ---------------------------------------------------

    private validateRanges(
        dto: Partial<CreateHistoryDTO>
    ): void {
        const ranges = [

            [
                "Total",
                dto.sumRange
            ]
        ] as const;

        for (const [name, range] of ranges) {
            if (!range) {
                continue;
            }

            if (!isValid(range)) {
                throw new AppError(
                    ERROR_CODES.INVALID_INPUT,
                    `${name} range is invalid.`
                );
            }
        }
    }


}