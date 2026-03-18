import { SYSTEM } from "../../../common/constants/system.constant";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { DeleteDto } from "../../../common/dtos/delete.dto";
import { IThemeRepository } from "../../thematics/themes/theme.repository";
import { IProjectRepository } from "../project.repository";
import { ProjectStatus } from "../project.state-machine";
import { CreateProjectThemeDTO, GetProjectThemeOptions } from "./project.theme.dto";
import { IProjectThemeRepository } from "./project.theme.repository";

export class ProjectThemeService {

    constructor(
        private readonly repository: IProjectThemeRepository,
        private readonly projectRepository: IProjectRepository,
        private readonly themeRepository: IThemeRepository
    ) {
        this.repository = repository;
        this.projectRepository = projectRepository;
        this.themeRepository = themeRepository;
    }

    async create(data: CreateProjectThemeDTO) {
        const { project, theme, applicantId } = data;
        const projectDoc = await this.projectRepository.findById(project);
        if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);

        if (String(projectDoc.applicant) !== applicantId && SYSTEM.SU_USER !== applicantId)
            throw new AppError(ERROR_CODES.USER_NOT_LEAD_PI);

        if (projectDoc.status !== ProjectStatus.draft &&
            projectDoc.status !== ProjectStatus.negotiation) {
            throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS);
        }
        const themeDoc = await this.themeRepository.findById(theme);
        if (!themeDoc) throw new AppError(ERROR_CODES.THEME_NOT_FOUND);
        try {
            return await this.repository.create(data);
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.PROJECT_THEME_ALREADY_EXISTS);
            }
            throw err;
        }
    }

    async get(options: GetProjectThemeOptions) {
        const items = await this.repository.find({ ...options, populate: true });
        return items;
    }

    async delete(dto: DeleteDto) {
        const { id, applicantId } = dto;

        const proThemeDoc = await this.repository.findById(id);
        if (!proThemeDoc) throw new AppError(ERROR_CODES.PROJECT_THEME_NOT_FOUND);

        const projectDoc = await this.projectRepository.findById(String(proThemeDoc.project));
        if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);

        if (String(projectDoc.applicant) !== applicantId && SYSTEM.SU_USER !== applicantId)
            throw new AppError(ERROR_CODES.USER_NOT_LEAD_PI);

        if (projectDoc.status !== ProjectStatus.draft &&
            projectDoc.status !== ProjectStatus.negotiation) {
            throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS);
        }

        return await this.projectRepository.delete(id);
    }
}
