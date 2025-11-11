import { Project } from "../project.model";
import { Stage } from "../../cycles/stages/stage.model";
import { CreateProjectStageDTO, GetProjectStagesDTO, UpdateProjectStageDTO } from "./project.stage.dto";
import { ProjectStageStatus } from "./project.stage.enum";
import { ProjectStage } from "./project.stage.model";


export class ProjectStageService {

    private static async validateProjectStage(dto: CreateProjectStageDTO) {

        const project = await Project.findById(dto.project).lean();
        if (!project) {
            throw new Error("Project Not Found!");
        }

        const stage = await Stage.findById(dto.stage).lean();
        if (!stage) {
            throw new Error("Stage Not Found!");
        }
        if (stage.status !== "active") {
            throw new Error("Stage is Not Active!");
        }
        if (stage.deadline < new Date()) {
            throw new Error("Stage Deadline has Passed!");
        }
        
        if (stage.order > 1) {
            const prevStage = await Stage.findOne({ order: stage.order - 1, cycle: stage.cycle }).lean();
            if (!prevStage) {
                throw new Error("Previous Stage Not Found!");
            }
            const prevProjectStage = await ProjectStage.findOne({ project: dto.project, stage: prevStage._id }).lean();
            if (!prevProjectStage) {
                throw new Error("Previous Project Stage Not Found!");
            }
            if (prevProjectStage.status !== ProjectStageStatus.accepted) {
                throw new Error("Previous Project Stage is Not Accepted!");
            }
        }
    }

    static async createProjectStage(data: CreateProjectStageDTO) {
        await this.validateProjectStage(data);
        const createdStage = await ProjectStage.create(data);
        return createdStage;
    }

    static async getProjectStages(options: GetProjectStagesDTO = {}) {
        const filter: any = {};
        if (options.project) filter.project = options.project;
        if (options.stage) filter.stage = options.stage;
        if (options.status) filter.status = options.status;

        const query = ProjectStage.find(filter)
            .populate("project")
            .populate("stage")
            .lean();

        if (typeof options.skip === "number") query.skip(options.skip);
        if (typeof options.limit === "number") query.limit(options.limit);

        const projectStages = await query;
        return projectStages;
    }



    static async updateProjectStage(id: string, data: Partial<UpdateProjectStageDTO["data"]>) {
        const projectStage = await ProjectStage.findById(id);
        if (!projectStage) throw new Error("Project stage not found");
        if (data && data.status && data.status !== projectStage.status) {
            const allowedTransitions: Record<ProjectStageStatus, ProjectStageStatus[]> = {
                [ProjectStageStatus.pending]: [ProjectStageStatus.submitted],
                [ProjectStageStatus.submitted]: [ProjectStageStatus.pending, ProjectStageStatus.accepted],
                [ProjectStageStatus.accepted]: [ProjectStageStatus.submitted],
            };

            const currentStatus = projectStage.status;
            const newStatus = data.status;

            if (!allowedTransitions[currentStatus].includes(newStatus)) {
                throw new Error(`Invalid status transition from '${currentStatus}' to '${newStatus}'`);
            }
        }
        Object.assign(projectStage, data);
        return projectStage.save();
    }

    static async deleteProjectStage(id: string) {
        const projectStage = await ProjectStage.findById(id);
        if (!projectStage) throw new Error("Project stage not found");
        if (projectStage.status !== ProjectStageStatus.pending) {
            throw new Error(`Can not delete ${projectStage.status} project stage`);
        }
        const deletedDoc = projectStage.toObject();
        await projectStage.deleteOne();
        return { documentPath: deletedDoc.documentPath };
    }
}
