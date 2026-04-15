import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { DeleteDto } from "../../common/dtos/delete.dto";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { TransitionHelper } from "../../common/helpers/transition.helper";

import { ITemplateRepository } from "./template.repository";
import {
    CreateTemplateDTO,
    GetTemplatesDTO,
    UpdateTemplateDTO
} from "./template.dto";
import { TemplateStatus } from "./template.model";

export const TEMPLATE_TRANSITIONS = {
    draft: [TemplateStatus.published],
    published: [TemplateStatus.draft]
};

export class TemplateService {

    constructor(
        private readonly repository: ITemplateRepository
    ) { }

    // ---------------- CREATE ----------------
    async create(dto: CreateTemplateDTO) {
        try {
            return await this.repository.create(dto);
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.TEMPLATE_ALREADY_EXISTS);
            }
            throw err;
        }
    }

    // ---------------- GET ----------------
    async get(options: GetTemplatesDTO) {
        return await this.repository.find(options);
    }

    // ---------------- TRANSITION ----------------
    async transitionState(dto: TransitionRequestDto) {
        const { id, current, next } = dto;

        const template = await this.repository.findById(id);
        if (!template) {
            throw new AppError(ERROR_CODES.TEMPLATE_NOT_FOUND);
        }

        const from = template.status as TemplateStatus;
        const to = next as TemplateStatus;

        if (current && current !== from) {
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);
        }

        TransitionHelper.validateTransition(
            from,
            to,
            TEMPLATE_TRANSITIONS
        );

        // 🔥 Important validation before publish
        if (to === TemplateStatus.published) {
            if (!template.sections || template.sections.length === 0) {
                throw new AppError(
                    ERROR_CODES.TEMPLATE_INVALID,
                    "Template must have at least one section"
                );
            }

            template.sections.forEach(section => {
                if (section.isRequired && (!section.fields || section.fields.length === 0)) {
                    throw new AppError(
                        ERROR_CODES.TEMPLATE_INVALID,
                        `Section "${section.title}" must have at least one field`
                    );
                }
            });
        }

        return await this.repository.update(id, {
            status: to
        });
    }

    // ---------------- UPDATE ----------------
    async update(dto: UpdateTemplateDTO) {
        const { id, data } = dto;

        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new AppError(ERROR_CODES.TEMPLATE_NOT_FOUND);
        }

        // 🔥 Restriction: prevent editing published template
        if (existing.status === TemplateStatus.published) {
            if (data.sections) {
                throw new AppError(
                    ERROR_CODES.TEMPLATE_LOCKED,
                    "Cannot modify sections of a published template"
                );
            }
        }

        // ⚠️ For now: full replace (safe if frontend sends full structure)
        return await this.repository.update(id, data);
    }

    // ---------------- DELETE ----------------
    async delete(dto: DeleteDto) {
        const { id } = dto;

        const template = await this.repository.findById(id);
        if (!template) {
            throw new AppError(ERROR_CODES.TEMPLATE_NOT_FOUND);
        }

        // Only allow delete in draft
        if (template.status !== TemplateStatus.draft) {
            throw new AppError(ERROR_CODES.TEMPLATE_NOT_DRAFT);
        }

        return await this.repository.delete(id);
    }
}