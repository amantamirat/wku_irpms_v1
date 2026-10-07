import fs from "fs/promises";
import path from "path";
import Handlebars from "handlebars";
import slugify from "slugify";



import {
    DocumentTemplateStatus,
    DocumentTemplateType,
    TemplateEngine,
} from "./document-template.model";

import {
    CreateDocumentTemplateDTO,
    FilterDocumentTemplateDTO,
    UpdateDocumentTemplateDTO,
} from "./document-template.dto";
import { DocumentTemplateRepository } from "./document-template.repository";
import { FileStorageService } from "../../common/services/file-storage.service";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { AppError } from "../../common/errors/app.error";




export class DocumentTemplateService {

    constructor(
        private readonly repository: DocumentTemplateRepository,
        private readonly fileStorage: FileStorageService,
    ) { }


    async create(
        dto: CreateDocumentTemplateDTO,
        file: Express.Multer.File,
        userId: string
    ) {
        let savedPath: string | null = null;

        try {
            // ---------------------------------------------------------
            // Validate file
            // ---------------------------------------------------------

            const ext = path.extname(file.originalname).toLowerCase();

            if (ext !== ".hbs") {
                throw new AppError(ERROR_CODES.INVALID_FILE_FORMAT);
            }

            // ---------------------------------------------------------
            // Read and validate template
            // ---------------------------------------------------------

            const source = await fs.readFile(file.path, "utf8");

            this.validate(source, dto.type);

            // ---------------------------------------------------------
            // Generate version
            // ---------------------------------------------------------

            const version = (await this.repository.latestVersion(dto.name)) + 1;

            // ---------------------------------------------------------
            // Generate safe filename
            // ---------------------------------------------------------

            const filename =
                `${slugify(dto.name, { lower: true, strict: true })}-v${version}.hbs`;

            // ---------------------------------------------------------
            // Move template from temporary storage
            // ---------------------------------------------------------

            savedPath = await this.fileStorage.move(
                file.path,
                `document-templates/${dto.type}s`,
                filename
            );

            // ---------------------------------------------------------
            // Create database record
            // ---------------------------------------------------------

            return await this.repository.create({
                name: dto.name,
                description: dto.description,
                version,
                type: dto.type,
                engine: TemplateEngine.HANDLEBARS,
                filePath: savedPath,
                //status: DocumentTemplateStatus.DRAFT,
                variables: dto.variables ?? [],
                createdBy: userId as any,
            });

        } catch (error) {

            // DB creation failed after file was moved
            if (savedPath) {
                await this.fileStorage.delete(savedPath);
            }

            // File was never moved, or move failed
            await this.fileStorage.discardTemp(file.path);

            throw error;
        }
    }


    async get(filter: FilterDocumentTemplateDTO = {}) {
        return await this.repository.findAll();
    }


    async getById(id: string) {
        const template = await this.repository.findById(id);

        if (!template) {
            throw new AppError(
                ERROR_CODES.DOCUMENT_TEMPLATE_NOT_FOUND
            );
        }

        return template;
    }


    async update(
        id: string,
        dto: UpdateDocumentTemplateDTO,
        userId: string
    ) {
        const template = await this.repository.findById(id);

        if (!template) {
            throw new AppError(
                ERROR_CODES.DOCUMENT_TEMPLATE_NOT_FOUND
            );
        }

        return await this.repository.update(id, {
            ...dto,
            updatedBy: userId as any,
        });
    }


    async delete(id: string, userId: string) {
        const template = await this.repository.findById(id);

        if (!template) {
            throw new AppError(
                ERROR_CODES.DOCUMENT_TEMPLATE_NOT_FOUND
            );
        }

        // Delete physical file first
        if (template.filePath) {
            await this.fileStorage.delete(template.filePath);
        }

        // Then delete DB record
        await this.repository.delete(id);

        return template;
    }


    private validate(
        source: string,
        type: DocumentTemplateType
    ) {
        try {
            // ---------------------------------------------------------
            // 1. Compile template
            // ---------------------------------------------------------

            const compiled = Handlebars.compile(
                source,
                {
                    strict: false,
                }
            );

            // ---------------------------------------------------------
            // 2. Trial render
            // ---------------------------------------------------------

            compiled(this.buildSampleData(type));

        } catch (error) {
            throw new AppError(
                ERROR_CODES.INVALID_DOCUMENT_TEMPLATE
            );
        }

        // -------------------------------------------------------------
        // 3. Reject triple-stash
        // -------------------------------------------------------------

        if (/\{\{\{/.test(source)) {
            throw new AppError(
                ERROR_CODES.TEMPLATE_UNSAFE
            );
        }
    }


    private buildSampleData(
        type: DocumentTemplateType
    ): Record<string, unknown> {

        switch (type) {

            case DocumentTemplateType.AGREEMENT:
                return {
                    project: {
                        title: "Sample Research Project",
                        code: "RP-001",
                    },
                    grant: {
                        title: "Sample Research Grant",
                        amount: 100000,
                    },
                    leadPI: {
                        name: "Sample Principal Investigator",
                    },
                    collaborators: [],
                    organization: {
                        name: "Wolkite University",
                    },
                };

            case DocumentTemplateType.CERTIFICATE:
                return {
                    project: {
                        title: "Sample Research Project",
                        code: "RP-001",
                    },
                    recipient: {
                        name: "Sample Recipient",
                    },
                    completionDate: new Date(),
                    organization: {
                        name: "Wolkite University",
                    },
                };

            default:
                return {};
        }
    }
}