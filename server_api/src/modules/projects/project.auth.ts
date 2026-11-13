import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { ApplicationRepository } from "../applications/application.repository";
import { FAILED_STATES } from "../applications/application.service";
import { AuthPermissionService } from "../auth/auth.permission-service";
import { IProject, ProjectStatus } from "./project.model";
import { IProjectRepository } from "./project.repository";

export class ProjectAuth {

    constructor(
        private readonly projectRepo: IProjectRepository,
        private readonly applicationRepo: ApplicationRepository,
        private readonly authPermissionService: AuthPermissionService,
    ) { }

    async auth(id: string, userId: string, permission: string) {
        const projectDoc = await this.projectRepo.findById(id);

        if (!projectDoc) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);
        }

        const isAdmin =
            await this.authPermissionService.hasPermission(userId, permission);

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

    async validateOwner(projectDoc: IProject) {
        if (projectDoc.status !== ProjectStatus.draft) {
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
        }
    }

    

}