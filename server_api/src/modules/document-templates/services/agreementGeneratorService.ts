
import Handlebars from "handlebars";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { PhaseStatus } from "../../projects/phase/phase.model";
import { DocumentTemplateStatus, IDocumentTemplate } from "../document-template.model";
import { GrantRepository } from "../../grants/grant.repository";
import { CollaboratorRepository } from "../../projects/collaborators/collaborator.repository";
import { PhaseActivityRepository } from "../../projects/phase/activities/phase-activity.repository";
import { PhaseRepository } from "../../projects/phase/phase.repository";
import { ProjectRepository } from "../../projects/project.repository";
import { DocumentTemplateRepository } from "../document-template.repository";
import { FileStorageService } from "../../../common/services/file-storage.service";
import { AgreementDataBuilder } from "./agreementDataBuilder";
import { PdfRenderer } from "./pdfRenderer";


export class AgreementGeneratorService {

    private cache = new Map<
        string,
        Handlebars.TemplateDelegate
    >();

    constructor(
        private readonly phaseRepo: PhaseRepository,
        private readonly projectRepo: ProjectRepository,
        private readonly collaboratorRepo: CollaboratorRepository,
        private readonly activityRepo: PhaseActivityRepository,
        private readonly grantRepo: GrantRepository,
        private readonly templateRepo: DocumentTemplateRepository,
        private readonly fileStorage: FileStorageService,
        private readonly builder: AgreementDataBuilder,
        private readonly pdf: PdfRenderer,
    ) { }


    async generatePhaseAgreement(
        phaseId: string
    ): Promise<Buffer> {

        // ---------------------------------------------------------
        // 1. Find phase
        // ---------------------------------------------------------

        const phase =
            await this.phaseRepo.findById(phaseId);

        if (!phase) {
            throw new AppError(
                ERROR_CODES.PHASE_NOT_FOUND
            );
        }


        // ---------------------------------------------------------
        // 2. Validate phase status
        // ---------------------------------------------------------

        if (phase.status !== PhaseStatus.approved) {
            throw new AppError(
                ERROR_CODES.PHASE_NOT_APPROVED
            );
        }


        // ---------------------------------------------------------
        // 3. Get project from phase
        // ---------------------------------------------------------

        const projectId = String(phase.project);

        const project =
            await this.projectRepo.findById(projectId);

        if (!project) {
            throw new AppError(
                ERROR_CODES.PROJECT_NOT_FOUND
            );
        }


        // ---------------------------------------------------------
        // 4. Get grant
        // ---------------------------------------------------------

        const grantId = String(project.grant);

        const grant =
            await this.grantRepo.findById(grantId);

        if (!grant?.agreementTemplate) {
            throw new AppError(
                ERROR_CODES.GRANT_HAS_NO_TEMPLATE
            );
        }


        // ---------------------------------------------------------
        // 5. Get agreement template
        // ---------------------------------------------------------

        const template =
            await this.templateRepo.findById(
                String(grant.agreementTemplate)
            );

        if (
            !template
            // || template.status !== DocumentTemplateStatus.ACTIVE
        ) {
            throw new AppError(
                ERROR_CODES.DOCUMENT_TEMPLATE_NOT_FOUND
            );
        }


        // ---------------------------------------------------------
        // 6. Load required project/phase data
        // ---------------------------------------------------------

        const [
            phases,
            collaborators,
            activities,
        ] = await Promise.all([
            this.phaseRepo.find({
                project: projectId,
            }),

            this.collaboratorRepo.find({
                project: projectId,
            }),

            this.activityRepo.find({
                phase: phaseId,
            }),
        ]);

        const sortedPhases = [...phases].sort(
            (a, b) => a.order - b.order
        );

        const startDate = sortedPhases[0]?.startDate ?? new Date();
        const endDate = sortedPhases[sortedPhases.length - 1]?.endDate ?? new Date();


        // ---------------------------------------------------------
        // 7. Build template data
        // ---------------------------------------------------------

        const data = this.builder.build({
            project,
            projectPhases: phases.length,
            startDate: startDate,
            endDate: endDate,
            phase,
            activities,
            grant,
            collaborators,
        });


        // ---------------------------------------------------------
        // 8. Compile template
        // ---------------------------------------------------------

        const compiled =
            await this.getCompiled(template);

        const html = compiled(data);


        // ---------------------------------------------------------
        // 9. Render PDF
        // ---------------------------------------------------------

        return await this.pdf.render(html);
    }


    private async getCompiled(
        template: IDocumentTemplate
    ): Promise<Handlebars.TemplateDelegate> {

        const key =
            `${String(template._id)}:${template.version}`;

        let compiled =
            this.cache.get(key);

        if (!compiled) {

            const source = (
                await this.fileStorage.read(template.filePath)
            ).toString("utf8");

            compiled =
                Handlebars.compile(source);

            this.cache.set(
                key,
                compiled
            );
        }

        return compiled;
    }
}