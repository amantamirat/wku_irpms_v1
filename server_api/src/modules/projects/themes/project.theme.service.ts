import { IThemeRepository, ThemeRepository } from "../../thematics/themes/theme.repository";
import { IProjectRepository, ProjectRepository } from "../project.repository";
import { ProjectStatus } from "../project.status";
import { CreateProjectThemeDTO, GetProjectThemeOptions } from "./project.theme.dto";
import { IProjectThemeRepository, ProjectThemeRepository } from "./project.theme.repository";

export class ProjectThemeService {

    private repository: IProjectThemeRepository;
    private projectRepository: IProjectRepository;
    private themeRepository: IThemeRepository;

    constructor(repository?: IProjectThemeRepository, projectRepository?: IProjectRepository,
        themeRepository?: IThemeRepository
    ) {
        this.repository = repository || new ProjectThemeRepository();
        this.projectRepository = projectRepository || new ProjectRepository();
        this.themeRepository = themeRepository || new ThemeRepository();
    }

    async create(data: CreateProjectThemeDTO) {
        const { project, theme } = data;
        const projectDoc = await this.projectRepository.findById(project);
        if (!projectDoc) throw new Error("Project not found");
        if (projectDoc.status !== ProjectStatus.pending &&
            projectDoc.status !== ProjectStatus.negotiation) {
            throw new Error("INVALID_PROJECT_STATUS_FOR_PROJECT_THEME_CREATE");
        }
        const themeDoc = await this.themeRepository.findById(theme);
        if (!themeDoc) throw new Error("Theme not found");
        const created = await this.repository.create(data);
        return created;
    }

    async get(options: GetProjectThemeOptions) {
        const items = await this.repository.find(options);
        return items;
    }

    async delete(id: string) {
        const deleted = await this.projectRepository.delete(id);
        if (!deleted) throw new Error("Project Theme not found");
    }
}
