// reviewer.service.ts
import { SYSTEM } from "../../../../../common/constants/system.constant";
import { AppError } from "../../../../../common/errors/app.error";
import { ERROR_CODES } from "../../../../../common/errors/error.codes";
import Applicant from "../../../../applicants/applicant.model";
import { CriterionRepository, ICriterionRepository } from "../../../../evaluations/criteria/criterion.repository";
import { Collaborator } from "../../../../projects/collaborators/collaborator.model";
import { IProjectRepository, ProjectRepository } from "../../../../projects/project.repository";
import { IStageRepository, StageRepository } from "../../stage.repository";
import { DocumentRepository, IDocumentRepository } from "../document.repository";
import { DocStatus } from "../document.status";
import { ProjectStageSynchronizer } from "../document.synchronizer";
import { IResultRepository, ResultRepository } from "./results/result.repository";
import { CreateReviewerDTO, GetReviewersDTO, UpdateReviewerDTO } from "./reviewer.dto";
import { IReviewerRepository, ReviewerRepository } from "./reviewer.repository";
import { ReviewerStateMachine } from "./reviewer.state-machine";
import { ReviewerStatus } from "./reviewer.status";

export class ReviewerService {

    private repository: IReviewerRepository;
    private resultRepository: IResultRepository;
    private projectRepository: IProjectRepository;
    private documentRepository: IDocumentRepository;
    private stageRepository: IStageRepository;
    private criterionRepository: ICriterionRepository;
    private projectStageSynchronizer: ProjectStageSynchronizer;
    //private permission: ReviewerPermission;

    constructor(repository?: IReviewerRepository, resultRepo?: IResultRepository,
        projectRepository?: IProjectRepository,
        documentRepo?: IDocumentRepository, projectStageSynchronizer?: ProjectStageSynchronizer
    ) {
        this.repository = repository || new ReviewerRepository();
        this.resultRepository = resultRepo || new ResultRepository();
        this.projectRepository = projectRepository || new ProjectRepository();
        this.documentRepository = documentRepo || new DocumentRepository();
        this.projectStageSynchronizer = projectStageSynchronizer ||
            new ProjectStageSynchronizer(this.documentRepository, this.repository);
        this.stageRepository = new StageRepository();
        this.criterionRepository = new CriterionRepository();
    }

    async create(dto: CreateReviewerDTO) {
        const { projectStage, applicant, weight } = dto;

        if (weight) {
            if (weight === 0 || weight < 0) {
                throw new Error("Invalid weight value");
            }
        }

        const projectStageDoc = await this.documentRepository.findById(projectStage);
        if (!projectStageDoc) throw new Error("Project Stage not found");

        if ([DocStatus.reviewed, DocStatus.accepted, DocStatus.rejected].includes(projectStageDoc.status)) {
            throw new Error(`This project stage is already ${projectStageDoc.status} and cannot create reviewers.`);
        }

        const applicantDoc = await Applicant.findById(applicant).lean();
        if (!applicantDoc) throw new Error("Applicant not found");

        ///////////////////////////will be modified//////////////////////////////////////////
        const projectDoc = await this.projectRepository.findById(String(projectStageDoc.project));
        if (!projectDoc) throw new Error("Project not found");

        if (String(projectDoc.leadPI) === applicant) {
            throw new Error("Reviewer applicant is already a lead pi on the project");
        }

        const collaborators = await Collaborator.find({ project: projectStageDoc.project }).lean();
        if (collaborators.find(c => String(c.applicant) === applicant)) {
            throw new Error("Reviewer applicant is already a collaborator on the project");
        }

        /////////////////////////////////////////////////////////////

        const created = await this.repository.create(dto);

        await this.projectStageSynchronizer.syncProjectStageStatus(projectStage, projectStageDoc);
        return created;
    }

    async getReviewers(options: GetReviewersDTO) {
        if (!options.projectStage && !options.applicant) {
            throw new Error("Project-Stage or Applicant is required");
        }
        if (options.projectStage) {
            return this.repository.findByProjectStage(options.projectStage);
        }
        if (options.applicant) {
            return this.repository.findByApplicant(options.applicant);
        }
    }

    // --- Change reviewer status (activate, submit, approve) ---
    async updateStatus(dto: UpdateReviewerDTO) {
        const { id, data, applicantId } = dto;
        const reviewerDoc = await this.repository.findById(id);
        if (!reviewerDoc) throw new Error("Reviewer not found");

        const projectStageDoc = await this.documentRepository.findById(reviewerDoc.projectStage.toString());
        if (!projectStageDoc) throw new Error("Project Stage not found");

        const next = data.status;
        if (!next) throw new Error("Status is required");

        const current = reviewerDoc.status;

        // Cannot change status if stage is finalized
        if ([DocStatus.accepted, DocStatus.rejected].includes(projectStageDoc.status)) {
            throw new Error(`The project stage is already ${projectStageDoc.status} and cannot be modified.`);
        }

        // --- State Machine Validation ---
        ReviewerStateMachine.validateTransition(current, next);



        /**
         * 
         * 
         * // Permissions
       const isActivationChange = current === ReviewerStatus.active || nextState === ReviewerStatus.active;
        const isApprovalChange = current === ReviewerStatus.approved || nextState === ReviewerStatus.approved;

        if (isActivationChange) {
            await this.permission.validateReviewerPermission(id, userId, reviewerDoc);
        }
        if (isApprovalChange) {
            await CacheService.validatePermission(userId, [PERMISSIONS.REVIEWER.APPROVE]);
        }
         */


        // Submitted status validation
        if (current === ReviewerStatus.verified && next === ReviewerStatus.submitted) {

            if (String(reviewerDoc.applicant) !== applicantId && SYSTEM.SU_USER !== applicantId)
                throw new AppError(ERROR_CODES.USER_NOT_REVIEWER);

            const stage = String(projectStageDoc.stage);
            const stageDoc = await this.stageRepository.findOne({ _id: stage });
            if (!stageDoc) throw new Error("Stage not found");

            const criteriaCount = await this.criterionRepository.countDocuments(String(stageDoc.evaluation));
            const results = await this.resultRepository.findByReviewer(id);

            if (results.length !== criteriaCount) {
                throw new Error("Please complete all evaluation criteria before submitting.");
            }

            const reviewerScore = results.reduce((sum, r) => sum + (r.score ?? 0), 0);
            dto.data.score = reviewerScore; // weight can still be applied elsewhere if needed
        }

        // Reset score if reverting from submitted to active
        if (current === ReviewerStatus.submitted && next === ReviewerStatus.verified) {
            dto.data.score = 0;
        }

        const updated = await this.repository.update(id, { status: next, score: dto.data.score });
        const syncedProjectStage = await this.projectStageSynchronizer.syncProjectStageStatus(reviewerDoc.projectStage.toString(), projectStageDoc);

        return { updated, syncedProjectStage };
    }

    // --- Update reviewer data (weight, etc.) ---
    async update(dto: UpdateReviewerDTO) {
        const { id, data, applicantId: userId } = dto;
        const reviewerDoc = await this.repository.findById(id);
        if (!reviewerDoc) throw new Error("Reviewer not found");

        if (reviewerDoc.status === ReviewerStatus.approved) {
            //throw new Error("Cannot update weight for approved reviewer!");
            throw new Error("INVALID_REVIEWER_STATUS_FOR_REVIEWER_UPDATE");
        }

        /*
        const projectStageDoc = await this.documentRepository.findById(reviewerDoc.projectStage.toString());
        if (!projectStageDoc) throw new Error("Project Stage not found");


        // Cannot update data if stage is finalized
        if ([DocStatus.accepted, DocStatus.rejected].includes(projectStageDoc.status)) {
            throw new Error(`The project stage is already ${projectStageDoc.status} and cannot be modified.`);
        }
*/
        const { weight } = data;
        if (weight !== undefined) {
            if (weight <= 0) {
                throw new Error("Invalid weight value");
            }
        }

        const updated = await this.repository.update(id, data);
        return updated;
    }

    async delete(id: string) {
        const reviewerDoc = await this.repository.findById(id);
        if (!reviewerDoc) throw new AppError(ERROR_CODES.REVIEWER_NOT_FOUND);
        if (reviewerDoc.status !== ReviewerStatus.pending)
            throw new AppError(ERROR_CODES.REVIEWER_NOT_PENDING);
        const deleted = await this.repository.delete(id);
        await this.projectStageSynchronizer.syncProjectStageStatus(reviewerDoc.projectStage.toString());
        return deleted
    }
}
