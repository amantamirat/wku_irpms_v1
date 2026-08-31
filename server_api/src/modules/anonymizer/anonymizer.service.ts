import path from "path";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { AnonymizationStatus, IApplication } from "../projects/applications/application.model";
import { ApplicationRepository } from "../projects/applications/application.repository";
import { CollaboratorRepository } from "../projects/collaborators/collaborator.repository";
import { PdfExtractorService } from "../templates/services/pdf-extractor.service";
import { IUser } from "../users/user.model";
import { AnonymizationEntity, AnonymizationEntityType, AnonymizationResult } from "./anonymizer.types";
import { PdfLayoutExtractorService } from "./pdf-layout-extractor.service";
import { PdfEntityLocationMatcher } from "./pdf-location-matcher";
import { SecurePdfRedactorService } from "./secure-pdf-redactor-service";

export class AnonymizerService {

    constructor(
        private readonly applicationRepo: ApplicationRepository,
        private readonly collaboratorRepo: CollaboratorRepository,
        private readonly pdfExtractor: PdfExtractorService = new PdfExtractorService(),
        private readonly layoutExtractor: PdfLayoutExtractorService = new PdfLayoutExtractorService(),
        private readonly locationMatcher: PdfEntityLocationMatcher = new PdfEntityLocationMatcher(),
        private readonly securedRedactor: SecurePdfRedactorService = new SecurePdfRedactorService()
    ) { }

    async anonymizeApplication(
        applicationId: string
    ): Promise<IApplication> {

        const application =
            await this.applicationRepo.findById(
                applicationId
            );

        if (!application) {
            throw new AppError(
                ERROR_CODES.APPLICATION_NOT_FOUND
            );
        }

        if (application.anonymizationStatus === AnonymizationStatus.processing) {
            throw new AppError(
                ERROR_CODES.ANONYMIZATION_IN_PROGRESS
            );
        }

        await this.applicationRepo.update(
            applicationId,
            {
                anonymizationStatus:
                    AnonymizationStatus.processing
            }
        );

        try {

            const collabs = await this.collaboratorRepo.find({
                project: String(application.project)
            }, { populate: true });

            const memberNames = collabs
                .map(collab => collab.member)
                .filter((member): member is IUser =>
                    member != null && typeof member === "object"
                )
                .map(member => member.name)
                .filter(Boolean);

            const result =
                await this.anonymize(
                    application.documentPath, memberNames
                );
            //console.log(result.outputPath);

            if (!result.outputPath) {
                throw new AppError(
                    ERROR_CODES.ANONYMIZATION_FAILED
                );
            }

            const relativeAnonymizedPath =
                path
                    .relative(process.cwd(), result.outputPath)
                    .replace(/\\/g, '/');

            const updated =
                await this.applicationRepo.update(
                    applicationId,
                    {
                        anonymizedDocumentPath:
                            relativeAnonymizedPath,

                        anonymizationStatus:
                            AnonymizationStatus.completed
                    }
                );

            return updated!;
            //return application;
        } catch (error) {

            await this.applicationRepo.update(
                applicationId,
                {
                    anonymizationStatus:
                        AnonymizationStatus.failed
                }
            );

            throw error;
        }
    }


    private async anonymize(
        filePath: string, memberNames: string[]
    ): Promise<AnonymizationResult> {

        const result =
            await this.analyze(filePath, memberNames);

        const parsed =
            path.parse(filePath);

        const outputPath =
            path.join(
                parsed.dir,
                `${parsed.name}.anonymized${parsed.ext}`
            );

        /*
    await this.redactor.redact(
        filePath,
        outputPath,
        result.entities
    );*/

        await this.securedRedactor.redactToImage(
            filePath,
            outputPath,
            result.entities
        );

        return {
            ...result,
            outputPath
        };
    }

    private async analyze(filePath: string, memberNames: string[]): Promise<AnonymizationResult> {

        const pdf = await this.pdfExtractor.extract(filePath);

        const pdfItems =
            await this.layoutExtractor.extract(filePath);

        const entities: AnonymizationEntity[] = [];

        // Collaborator / member names
        for (const memberName of memberNames) {

            const nameParts =
                this.splitMemberName(memberName);
            for (const name of nameParts) {

                const locations =
                    this.locationMatcher.findLocations(
                        name,
                        pdfItems,
                        AnonymizationEntityType.MEMBER
                    );

                if (locations.length === 0) {
                    continue;
                }

                entities.push({
                    type: AnonymizationEntityType.MEMBER,
                    original: name,
                    replacement: "[NAME REDACTED]",
                    confidence: 1,
                    locations
                });
            }
        }

        // emails
        const emails = this.detectEmails(pdf.text);
        for (const email of emails) {

            const locations = this.locationMatcher.findLocations(
                email,
                pdfItems,
                AnonymizationEntityType.EMAIL
            );
            entities.push({
                type: AnonymizationEntityType.EMAIL,
                original: email,
                replacement: "[EMAIL REDACTED]",
                confidence: 1,
                locations
            });
        }

        // phones
        const phones = this.detectPhones(pdf.text);
        for (const phone of phones) {
            const locations = this.locationMatcher.findLocations(
                phone,
                pdfItems,
                AnonymizationEntityType.PHONE
            );
            entities.push({
                type: AnonymizationEntityType.PHONE,
                original: phone,
                replacement: "[PHONE REDACTED]",
                confidence: 1,
                locations
            });
        }

        // ORCIDs
        const orcids = this.detectOrcids(pdf.text);
        for (const orcid of orcids) {
            const locations = this.locationMatcher.findLocations(
                orcid,
                pdfItems,
                AnonymizationEntityType.ORCID
            );
            entities.push({
                type: AnonymizationEntityType.ORCID,
                original: orcid,
                replacement: "[ORCID REDACTED]",
                confidence: 1,
                locations
            });
        }

        return {
            entities
        };
    }

    private detectEmails(text: string): string[] {

        const regex =
            /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

        return [...new Set(text.match(regex) ?? [])];
    }

    private detectPhones(text: string): string[] {
        const regex =
            /(?:\+251[\s-]?9|251[\s-]?9|09)\d(?:[\s-]?\d){7}/g;

        return [
            ...new Set(
                (text.match(regex) ?? [])
                    .map(phone => phone.trim())
            )
        ];
    }

    private detectOrcids(text: string): string[] {

        const regex =
            /\b(?:https?:\/\/)?(?:www\.)?orcid\.org\/\d{4}-\d{4}-\d{4}-\d{3}[\dX]\b|\b\d{4}-\d{4}-\d{4}-\d{3}[\dX]\b/gi;

        return [...new Set(text.match(regex) ?? [])];
    }

    private splitMemberName(name: string): string[] {
        return name
            /*.replace(
                /^(dr|doctor|mr|mrs|ms|miss|prof|professor)\.?\s+/i,
                ""
            )*/
            .trim()
            .split(/\s+/)
            .filter(Boolean);
    }
}