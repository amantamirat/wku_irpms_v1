// reviewer.service.ts
import { SYSTEM } from "../../common/constants/system.constant";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { ApplicantRepository, IApplicantRepository } from "../applicants/applicant.repository";
import { ICriterionRepository, CriterionRepository } from "../evaluations/criteria/criterion.repository";
import { CollaboratorRepository, ICollaboratorRepository } from "../projects/collaborators/collaborator.repository";
import { ProjectStageRepository, IProjectStageRepository } from "../projects/stages/project.stage.repository";
import { ProjectStageStatus } from "../projects/stages/project.stage.status";
import { ProjectStageSynchronizer } from "./project.stage.synchronizer";
import { IProjectRepository, ProjectRepository } from "../projects/project.repository";
import { ICallStageRepository, CallStageRepository } from "../calls/stages/call.stage.repository";
import { IResultRepository, ResultRepository } from "./results/result.repository";
import { CreateReviewerDTO, GetReviewersDTO, UpdateReviewerDTO } from "./reviewer.dto";
import { IReviewerRepository, ReviewerRepository } from "./reviewer.repository";

import { ReviewerStatus } from "./reviewer.status";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { TransitionHelper } from "../../common/helpers/transition.helper";
import { REVIEWER_TRANSITIONS } from "./reviewer.state-machine";

export class ReviewerService {

    private docSynchronizer: ProjectStageSynchronizer;

    constructor(
        private readonly repository: IReviewerRepository = new ReviewerRepository(),
        private readonly projectStageRepo: IProjectStageRepository = new ProjectStageRepository(),
        private readonly applicantRepository: IApplicantRepository = new ApplicantRepository(),

        private readonly projectRepository: IProjectRepository = new ProjectRepository(),
        private readonly collaboratorRepository: ICollaboratorRepository = new CollaboratorRepository(),

        private readonly resultRepository: IResultRepository = new ResultRepository(),
        private readonly stageRepository: ICallStageRepository = new CallStageRepository(),
        private readonly criterionRepository: ICriterionRepository = new CriterionRepository(),

    ) {
        this.docSynchronizer =
            new ProjectStageSynchronizer(this.projectStageRepo, this.repository);
    }

    async create(dto: CreateReviewerDTO) {
        const { projectStage, applicant, weight } = dto;
        /*
        if (weight && (weight === 0 || weight < 0))
            throw new Error(ERROR_CODES.INVALID_REVIEWER_WEIGHT);*/

        const projectStageDoc = await this.projectStageRepo.findById(projectStage);
        if (!projectStageDoc) throw new AppError(ERROR_CODES.PROJECT_STAGE_NOT_FOUND);
        const projectStageStatus = projectStageDoc.status;
        if (projectStageStatus !== ProjectStageStatus.selected)
            throw new AppError(ERROR_CODES.INVALID_DOC_STATUS);
        
        const applicantDoc = await this.applicantRepository.findById(applicant);
        if (!applicantDoc) throw new Error(ERROR_CODES.APPLICANT_NOT_FOUND);

        
        const collaborators = await this.collaboratorRepository.find({ project: String(projectStageDoc.project) });
        if (collaborators.find(c => String(c.applicant) === applicant)) {
            throw new AppError(ERROR_CODES.INVALID_REVIEWER);
        }
        try {
            const created = await this.repository.create(dto);
           // await this.docSynchronizer.sync(projectStage);
            return created;
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.REVIEWER_ALREADY_EXISTS);
            }
            throw err;
        }
    }

    async getReviewers(options: GetReviewersDTO) {
        return this.repository.find({ ...options, populate: true });
    }

    /*
    // --- Change reviewer status (activate, submit, approve) ---
    async updateStatus(dto: UpdateReviewerStatusDTO) {
        const { id, status: next, applicantId } = dto;
        const reviewerDoc = await this.repository.findById(id);
        if (!reviewerDoc) throw new AppError(ERROR_CODES.REVIEWER_NOT_FOUND);
        const current = reviewerDoc.status;

        // --- State Machine Validation ---
        ReviewerStateMachine.validateTransition(current, next);

        const projectStageDoc = await this.documentRepository.findById(String(reviewerDoc.projectStage));
        if (!projectStageDoc) throw new AppError(ERROR_CODES.PROJECT_STAGE_NOT_FOUND);

        if ([ProjectStageStatus.accepted, ProjectStageStatus.rejected].includes(projectStageDoc.status)) {
            throw new AppError(ERROR_CODES.INVALID_DOC_STATUS);
        }

        let score: number | undefined = undefined;

        const stage = String(projectStageDoc.grantStage);
        const stageDoc = await this.stageRepository.findById(stage);
        if (!stageDoc) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
        //const evaluation = String(stageDoc.evaluation);
        const evaluation = "";
        if (next === ReviewerStatus.accepted) {
            const existingResults = await this.resultRepository.find({ reviewer: id });
            if (existingResults.length === 0) {
                const criteria = await this.criterionRepository.find({ evaluation });
                await this.resultRepository.insertMany(
                    criteria.map(c => ({
                        reviewer: id,
                        criterion: String(c._id),
                        score: null
                    }))
                );
            }
        }

        if (current === ReviewerStatus.accepted && next === ReviewerStatus.submitted) {
            if (String(reviewerDoc.applicant) !== applicantId && SYSTEM.SU_USER !== applicantId)
                throw new AppError(ERROR_CODES.USER_NOT_REVIEWER);
            const results = await this.resultRepository.find({ reviewer: id });
            const incomplete = results.some(r => r.score === null || r.score === undefined);
            if (incomplete) {
                throw new AppError(ERROR_CODES.INCOMPELTE_CRITERIA);
            }
            score = results.reduce((sum, r) => sum + (r.score ?? 0), 0);
        }

        const updateData: any = { status: next };
        if (score !== undefined) {
            updateData.score = score;
        }
        const updated = await this.repository.update(id, updateData);
        await this.docSynchronizer.sync(reviewerDoc.projectStage.toString());
        return updated;

    }
    */

    // --- Update reviewer data (weight) ---
    async update(dto: UpdateReviewerDTO) {
        const { id, data, applicantId } = dto;
        const { weight } = data;
        const reviewerDoc = await this.repository.findById(id);
        if (!reviewerDoc) throw new Error(ERROR_CODES.REVIEWER_NOT_FOUND);
        if (reviewerDoc.status !== ReviewerStatus.pending) {
            throw new Error(ERROR_CODES.REVIEWER_NOT_PENDING);
        }
        if (!weight || (weight === 0 || weight < 0))
            throw new Error(ERROR_CODES.INVALID_REVIEWER_WEIGHT);

        const updated = await this.repository.update(id, { weight });
        return updated;
    }

    async transitionState(dto: TransitionRequestDto) {
        const { id, current, next } = dto;

        const reviewerDoc = await this.repository.findById(id);
        if (!reviewerDoc) {
            throw new AppError(ERROR_CODES.REVIEWER_NOT_FOUND);
        }
        const from = reviewerDoc.status as ReviewerStatus;
        const to = next as ReviewerStatus;

        if (current && current !== from) {
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);
        }

        TransitionHelper.validateTransition(
            from,
            to,
            REVIEWER_TRANSITIONS
        );

        return await this.repository.updateStatus(id, to);
    }

    async delete(id: string) {
        const reviewerDoc = await this.repository.findById(id);
        if (!reviewerDoc) throw new AppError(ERROR_CODES.REVIEWER_NOT_FOUND);
        if (reviewerDoc.status !== ReviewerStatus.pending)
            throw new AppError(ERROR_CODES.REVIEWER_NOT_PENDING);
        const deleted = await this.repository.delete(id);
        /*
        if (deleted) {
            await this.resultRepository.deleteByReviewer(id);
            await this.docSynchronizer.sync(reviewerDoc.projectStage.toString());
        }
        */
        return deleted
    }
}
