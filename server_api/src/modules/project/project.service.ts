import mongoose from "mongoose";
import { CallStatus } from "../call/call.enum";
import { Call } from "../call/call.model";
import { CollaboratorService, CreateCollaboratorDto } from "./collaborators/collaborator.service";
import { CreatePhaseDto } from "./phase/phase.service";
import { ProjectStatus } from "./project.enum";
import { Project } from "./project.model";
import { CreateProjectThemeDto } from "./themes/project.theme.service";
import Applicant from "../applicants/applicant.model";
import { Collaborator } from "./collaborators/collaborator.model";
import { CollaboratorStatus } from "./collaborators/collaborator.enum";
import { Phase } from "./phase/phase.model";
import { PhaseType } from "./phase/phase.enum";
import { ProjectTheme } from "./themes/project.theme.model";
import { Stage } from "../call/evaluations/evaluation.model";
import { BaseTheme } from "../call/themes/theme.model";
import { ProjectStage } from "./stages/stage.model";
import { CreateProjectStageDto } from "./stages/stage.service";
import { ProjectStageStatus } from "./stages/stage.enum";

export interface CreateProjectDto {
    call: mongoose.Types.ObjectId;
    title: string;
    summary?: string;
    createdBy: mongoose.Types.ObjectId;
    collaborators?: CreateCollaboratorDto[];
    phases?: CreatePhaseDto[];
    themes?: CreateProjectThemeDto[];
    documentPath?: string;
}

export class ProjectService {

    private static async validateProject(project: CreateProjectDto) {
        const call = await Call.findById(project.call).lean();
        if (!call) throw new Error("Call not found");
        if (call.status !== CallStatus.active) throw new Error("Call is not active.");
        const now = new Date();
        if (call.deadline < now) {
            throw new Error("The deadline for this call has already passed");
        }
    }

    static async createProject(data: CreateProjectDto) {
        await this.validateProject(data);
        //is it mandatory....?
        //const applicant = await ApplicantService.findApplicant({ uid: data.createdBy }) as any;
        //if (!applicant) {
        //throw new Error("Default Applicant Data Not Found.");
        //}
        const createdProject = await Project.create({ ...data, status: ProjectStatus.pending });
        //await CollaboratorService.createCollaborator({ applicant: applicant._id, project: createdProject._id, isLeadPI: true, status: CollaboratorStatus.active });
        return createdProject;
    }

    static async submitProject(dto: CreateProjectDto) {
        //Check the call existance and deadline
        if (!dto.documentPath) {
            throw new Error("Document path not found");
        }
        const call = await Call.findOne({ _id: dto.call, status: CallStatus.active }).lean();
        if (!call) throw new Error("Call not found");
        const now = new Date();
        if (call.deadline < now) {
            throw new Error("The deadline for this call has already passed");
        }
        //Find the first stage
        const stage = await Stage.findOne({ parent: call.evaluation, order: 1 }).lean();
        if (!stage) throw new Error("Stage not found");

        //Check collaborator applicants
        let hasLeadPI = false;
        for (const collab of dto.collaborators ?? []) {
            const applicant = await Applicant.findById(collab.applicant).lean();
            if (!applicant) {
                throw new Error(`Applicant not found: ${collab.applicant}`);
            }
            if (collab.isLeadPI) {
                if (hasLeadPI) {
                    throw new Error("A project can have only one Lead PI");
                }
                hasLeadPI = true;
            }
        }
        if(!hasLeadPI){
            throw new Error("Lead PI not found");
        }
        //check themes
        for (const t of dto.themes ?? []) {
            const theme = await BaseTheme.findOne({ _id: t.theme, catalog: call.theme }).lean();
            if (!theme) {
                throw new Error(`Theme not found: ${t.theme}`);
            }
        }
        const submittedProject = await Project.create({ ...dto, status: ProjectStatus.pending });
        const collaborators = dto.collaborators?.filter((c, index, self) =>
            index === self.findIndex(cc => cc.applicant.toString() === c.applicant.toString())
        ).map(c => ({
            ...c,
            project: submittedProject._id,
            status: c.isLeadPI ? CollaboratorStatus.active : CollaboratorStatus.pending
        }));
        const themes = dto.themes?.filter((t, index, self) =>
            index === self.findIndex(tt => tt.theme.toString() === t.theme.toString())
        ).map(theme => ({
            ...theme,
            project: submittedProject._id
        }));
        const phases = dto.phases?.map(phase => ({
            ...phase,
            type: PhaseType.phase,
            project: submittedProject._id
        }));
        const projectStage: CreateProjectStageDto = {
            project: submittedProject._id,
            stage: stage._id,
            documentPath: dto.documentPath,
            status:ProjectStageStatus.submitted
        }
        await Collaborator.insertMany(collaborators);
        await ProjectTheme.insertMany(themes);
        await Phase.insertMany(phases);
        await ProjectStage.create(projectStage);
        return submittedProject;
    }

    static async getProjects() {
        return await Project.find().populate('call').lean();
    }


    static async updateProject(id: string, data: Partial<CreateProjectDto>) {
        const project = await Project.findById(id);
        if (!project) throw new Error("Project not found");
        Object.assign(project, data);
        return project.save();
    }

    static async deleteProject(id: string) {
        const project = await Project.findById(id);
        if (!project) throw new Error("Project not found");
        const collaborator = await Collaborator.exists({ project: project._id });
        if (collaborator) {
            throw new Error(`Cannot delete: ${project.title} collaborator exist.`);
        }
        return await project.deleteOne();
    }
}
