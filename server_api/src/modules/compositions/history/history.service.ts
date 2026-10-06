import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { isValid } from "../../../common/types/range";
import {
    CreateHistoryDTO,
    UpdateHistoryDTO
} from "./history.dto";
import {
    HistoryMetric,
    IHistoryRule
} from "./history.model";
import { HistoryRepository } from "./history.repository";

export class HistoryService {
    constructor(
        private readonly repository: HistoryRepository
    ) { }

    // ---------------------------------------------------
    // CREATE
    // ---------------------------------------------------

    async create(dto: CreateHistoryDTO): Promise<IHistoryRule> {
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
        this.validateTotal(dto);
    }

    // ---------------------------------------------------
    // RANGE VALIDATION
    // ---------------------------------------------------

    private validateRanges(
        dto: Partial<CreateHistoryDTO>
    ): void {
        const ranges = [
            /*
            [
                "Project granted",
                dto.project?.granted
            ],
            [
                "Project refused",
                dto.project?.refused
            ],
            [
                "Project completed",
                dto.project?.completed
            ],
            [
                "Project verified",
                dto.project?.verified
            ],

            [
                "Application submitted",
                dto.application?.submitted
            ],
            [
                "Application accepted",
                dto.application?.accepted
            ],
            [
                "Application rejected",
                dto.application?.rejected
            ],

            [
                "Verification submitted",
                dto.verification?.submitted
            ],
            [
                "Verification verified",
                dto.verification?.verified
            ],
            [
                "Verification rejected",
                dto.verification?.rejected
            ],
*/
            [
                "Total",
                dto.total?.range
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

    // ---------------------------------------------------
    // TOTAL VALIDATION
    // ---------------------------------------------------

    private validateTotal(
        dto: Partial<CreateHistoryDTO>
    ): void {
        const total = dto.total;

        if (!total) {
            return;
        }

        // -----------------------------------------------
        // At least one metric must be selected
        // -----------------------------------------------

        if (
            !Array.isArray(total.fields) ||
            total.fields.length === 0
        ) {
            throw new AppError(
                ERROR_CODES.INVALID_INPUT,
                "Total must contain at least one metric field."
            );
        }

        // -----------------------------------------------
        // Validate metric values
        // -----------------------------------------------

        const validMetrics = new Set(
            Object.values(HistoryMetric)
        );

        for (const field of total.fields) {
            if (!validMetrics.has(field)) {
                throw new AppError(
                    ERROR_CODES.INVALID_INPUT,
                    `Invalid history metric: ${field}`
                );
            }
        }

        // -----------------------------------------------
        // Remove duplicate fields
        // -----------------------------------------------

        const uniqueFields = new Set(total.fields);

        if (uniqueFields.size !== total.fields.length) {
            throw new AppError(
                ERROR_CODES.INVALID_INPUT,
                "Total metric fields cannot contain duplicates."
            );
        }
    }
}