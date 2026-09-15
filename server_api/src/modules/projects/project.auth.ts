import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { AuthPermissionService } from "../auth/auth.permission-service";
import { IProjectRepository } from "./project.repository";

export class ProjectAuth {

    constructor(
        private readonly projectRepo: IProjectRepository,
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

}