import { ClientSession } from "mongoose";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { IProjectRepository } from "./project.repository";

export class ProjectAuth {
    constructor(
        private readonly projectRepo: IProjectRepository
    ) { }

    async authProject(project: string, applicant: string, session?: ClientSession) {
        const projectDoc = await this.projectRepo.findById(
            project, { populate: { grantAllocation: true } }, session);

        if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);

        if (String(projectDoc.applicant) !== applicant)
            throw new AppError(ERROR_CODES.UNAUTHORIZED);

        return projectDoc;
    }
}