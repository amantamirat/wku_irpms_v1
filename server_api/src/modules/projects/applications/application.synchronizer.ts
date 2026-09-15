import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { IProjectRepository } from "../project.repository";
import { IApplicationRepository } from "./application.repository";

export class ApplicationSynchronizer {
    constructor(
        private readonly projectRepo: IProjectRepository,
        private readonly applicationRepo: IApplicationRepository,
    ) { }

    async sync(project: string) {

        const projectDoc = await this.projectRepo.findById(project);

        if (!projectDoc)
            throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);

        const latestApplication = await this.applicationRepo.findLatestByProject(project);
        /**
         * Synchronize currentApplication
         */
        const currentId = projectDoc.currentApplication
            ? String(projectDoc.currentApplication)
            : undefined;

        if (!latestApplication) {
            if (currentId) {
                await this.projectRepo.update(project, { currentApplication: null });
            }
        } else {
            const latestId = String(latestApplication._id);

            if (currentId !== latestId) {
                await this.projectRepo.update(
                    project,
                    {
                        currentApplication: latestId
                    }
                );
            }
        }
        return projectDoc;
    }
}