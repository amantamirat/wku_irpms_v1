import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { CreateTemplateDTO, CreateTemplateSectionDTO, UpdateTemplateDTO, UpdateTemplateSectionDTO } from "./template.dto";
import { TemplateRepository } from "./template.repository";

export class TemplateService {
    constructor(
        private readonly repository = new TemplateRepository()
    ) { }

    async create(dto: CreateTemplateDTO) {
        await this.validateName(dto.name);
        this.validateSections(dto.sections);
        return this.repository.create(dto);
    }

    async findAll() {
        return this.repository.findAll();
    }

    async findById(id: string) {
        const template = await this.repository.findById(id);
        if (!template) {
            throw new AppError(ERROR_CODES.TEMPLATE_NOT_FOUND);
        }
        return template;
    }

    async update(id: string, dto: UpdateTemplateDTO) {

        const template = await this.findById(id);

        if (dto.name && dto.name !== template.name) {
            await this.validateName(dto.name, id);
        }

        if (dto.sections) {
            this.validateSections(dto.sections);
        }

        return this.repository.update(id, dto);
    }

    async delete(id: string) {
        await this.findById(id);
        return this.repository.delete(id);
    }

    // private helpers
    private async validateName(name: string, excludeId?: string) {
        const exists = await this.repository.exists(name, excludeId);
        if (exists) {
            throw new AppError(ERROR_CODES.TEMPLATE_ALREADY_EXISTS);
        }
    }

    private validateSections(
        sections: (CreateTemplateSectionDTO | UpdateTemplateSectionDTO)[]
    ) {
        if (!sections.length) {
            throw new AppError(ERROR_CODES.TEMPLATE_SECTION_REQUIRED);
        }

        const names = new Set<string>();

        for (const section of sections) {

            if (!section.name) {
                throw new AppError(ERROR_CODES.TEMPLATE_SECTION_NAME_REQUIRED);
            }

            const name = section.name.trim().toLowerCase();

            if (names.has(name)) {
                throw new AppError(ERROR_CODES.TEMPLATE_DUPLICATE_SECTION);
            }

            names.add(name);

            if (
                section.minWords &&
                section.maxWords &&
                section.minWords > section.maxWords
            ) {
                throw new AppError(ERROR_CODES.INVALID_WORD_RANGE);
            }
        }
    }
}