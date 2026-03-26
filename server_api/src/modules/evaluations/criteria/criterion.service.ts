import fs from "fs";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { IResultRepository } from "../../calls/stages/reviewers/results/result.repository";
import { SettingKey } from "../../settings/setting.model";
import { SettingService } from "../../settings/setting.service";
import { IEvaluationRepository } from "../evaluation.repository";
import {
    CreateCriterionDTO,
    GetCriteriaDTO,
    ImportCriteriaBatchDTO,
    UpdateCriterionDTO
} from "./criterion.dto";
import { ICriterionRepository } from "./criterion.repository";
import { EvalStatus } from "../evaluation.state-machine";
import { FormType } from "./criterion.model";

export class CriterionService {

    constructor(
        private readonly repository: ICriterionRepository,
        private readonly resultRep: IResultRepository,
        private readonly evalRepo: IEvaluationRepository,
        private readonly settingService: SettingService,
    ) { }

    /**
     * Create a single criterion.
     */
    async create(dto: CreateCriterionDTO) {
        const evalDoc = await this.evalRepo.findById(dto.evaluation);
        if (!evalDoc) throw new AppError(ERROR_CODES.EVALUATION_NOT_FOUND);
        if (evalDoc.status !== EvalStatus.draft) {
            throw new AppError(ERROR_CODES.EVALUATION_NOT_DRAFT);
        }

        /**
         * 
         * if (dto.formType === FormType.OPEN) {
            dto.weight = 0;
            dto.options = []
        }
         */
        

        // Validation: Ensure no option score exceeds the criterion weight
        if (dto.options) {
            this.validateOptionScores(dto.options, dto.weight);
        }

        return await this.repository.create(dto);
    }

    async get(dto: GetCriteriaDTO) {
        return await this.repository.find(dto);
    }

    /**
     * Update an existing criterion.
     */
    async update(dto: UpdateCriterionDTO) {
        const { id, data } = dto;

        const criterion = await this.repository.findById(id);
        if (!criterion) throw new AppError(ERROR_CODES.CRITERION_NOT_FOUND);

        const evalDoc = await this.evalRepo.findById(String(criterion.evaluation));
        if (!evalDoc) throw new AppError(ERROR_CODES.EVALUATION_NOT_FOUND);
        if (evalDoc.status !== EvalStatus.draft) {
            throw new AppError(ERROR_CODES.EVALUATION_NOT_DRAFT);
        }

        // Logic check: If updating options or weight, re-validate
        const newWeight = data.weight ?? criterion.weight;
        const newOptions = data.options ?? criterion.options;

        if (newOptions) {
            this.validateOptionScores(newOptions, newWeight);
        }

        return this.repository.update(id, data);
    }

    /**
     * Delete a criterion only if no results have been submitted yet.
     */
    async delete(id: string) {
        const criterionDoc = await this.repository.findById(id);
        if (!criterionDoc) throw new AppError(ERROR_CODES.CRITERION_NOT_FOUND);

        const evalDoc = await this.evalRepo.findById(String(criterionDoc.evaluation));
        if (!evalDoc) throw new AppError(ERROR_CODES.EVALUATION_NOT_FOUND);
        if (evalDoc.status !== EvalStatus.draft) {
            throw new AppError(ERROR_CODES.EVALUATION_NOT_DRAFT);
        }
        // We check Results because deleting a criterion would orphan those results.
        const resExists = await this.resultRep.exists({ criterion: id });
        if (resExists) throw new AppError(ERROR_CODES.RESULT_ALREADY_EXISTS);
        return await this.repository.delete(id);
    }


    async importFromFile(file: Express.Multer.File, evaluationId: string) {
        // 1. Get Dynamic Settings
        const maxSizeMB = await this.settingService.getSettingValue<number>(
            SettingKey.MAX_FILE_UPLOAD_SIZE_MB,
            5 // Default 5MB
        );

        // 2. Validate Size (Multer gives size in bytes)
        const fileSizeBytes = file.size;
        if (fileSizeBytes > maxSizeMB * 1024 * 1024) {
            throw new AppError(ERROR_CODES.FILE_TOO_LARGE);
        }

        // 3. Process File (Example for JSON)
        const fileContent = fs.readFileSync(file.path, 'utf-8');
        const criteriaData = JSON.parse(fileContent);

        // 4. Use your existing batch import logic
        const result = await this.import({ evaluation: evaluationId, criteriaData });

        // 5. Clean up: Delete temp file after import
        fs.unlinkSync(file.path);

        return result;
    }


    /**
     * Batch import criteria with embedded options.
     */
    // criterion.service.ts

    async import(dto: ImportCriteriaBatchDTO) {
        const { evaluation, criteriaData } = dto;
        // 1️⃣ Business Logic: Check if evaluation exists
        const evalDoc = await this.evalRepo.findById(evaluation);
        if (!evalDoc) throw new AppError(ERROR_CODES.EVALUATION_NOT_FOUND);
        if (evalDoc.status !== EvalStatus.draft) throw new AppError(ERROR_CODES.EVALUATION_NOT_DRAFT);


        // 2️⃣ Business Logic: Validate all data before sending to Repo
        const dtosToCreate: CreateCriterionDTO[] = criteriaData.map((item, index) => {
            if (item.options) {
                this.validateOptionScores(item.options, item.weight);
            }

            return {
                evaluation: evaluation,
                title: item.title,
                weight: item.weight,
                formType: item.formType,
                options: item.options,
                order: item.order ?? index
            };
        });

        // 3️⃣ Abstract Call: Let the repo handle the DB heavy lifting
        return await this.repository.createMany(dtosToCreate);
    }

    /**
     * Helper to ensure data integrity
     */

    private validateOptionScores(options: any[], maxWeight: number) {
        for (const opt of options) {
            if (opt.score > maxWeight) {
                throw new AppError(ERROR_CODES.INVALID_CRITERION_WEIGHT,
                    `Weight of ${opt.title}, ${opt.score} execced ${maxWeight} `);
            }
        }
    }
}