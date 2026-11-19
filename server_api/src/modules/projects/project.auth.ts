import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { ApplicationRepository } from "../applications/application.repository";
import { FAILED_STATES } from "../applications/application.service";
import { AuthPermissionService } from "../auth/auth.permission-service";
import { StageStatus } from "../calls/stages/stage.model";
import { IStageRepository } from "../calls/stages/stage.repository";
import { IProject, ProjectStatus } from "./project.model";
import { IProjectRepository } from "./project.repository";

export class ProjectAuth {

    constructor(
        private readonly projectRepo: IProjectRepository,
        private readonly applicationRepo: ApplicationRepository,
        private readonly stageRepo: IStageRepository,
        private readonly authPermissionService: AuthPermissionService,
    ) { }

    async getProject(projectId: string) {
        const projectDoc = await this.projectRepo.findById(projectId);
        if (!projectDoc) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);
        }
        return projectDoc;
    }

    async auth(id: string, userId: string, permission?: string) {
        const projectDoc = await this.getProject(id);

        const isAdmin = permission ?
            await this.authPermissionService.hasPermission(userId, permission) : false;

        const isLeadPI =
            String(projectDoc.leadPI) === String(userId);

        if (!isAdmin && !isLeadPI) {
            throw new AppError(ERROR_CODES.UNAUTHORIZED);
        }

        return {
            projectDoc,
            isAdmin,
            isLeadPI,
        };
    }

    async validateOwner(projectDoc: IProject, skipDraft?: boolean) {
        if (!skipDraft && projectDoc.status !== ProjectStatus.draft) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_DRAFT);
        }
        if (projectDoc.currentApplication) {
            const applicationDoc = await this.applicationRepo.findById(String(projectDoc.currentApplication));
            if (!applicationDoc) {
                throw new AppError(ERROR_CODES.APPLICATION_NOT_FOUND);
            }
            if (FAILED_STATES.includes(applicationDoc.status)) {
                throw new AppError(ERROR_CODES.INVALID_APPLICATION_STATUS);
            }

            const stageDoc = await this.stageRepo.findById(applicationDoc.stage.toString());
            if (!stageDoc) {
                throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
            }
            if (stageDoc.status !== StageStatus.active) {
                throw new AppError(ERROR_CODES.STAGE_NOT_ACTIVE);
            }
        }
    }



}