import Applicant from "../applicants/applicant.model";
import { CallStatus } from "../call/call.enum";
import { Call } from "../call/call.model";
import { ConstraintValidator } from "../grants/constraints/constraint.validator";
import { BaseTheme } from "../themes/theme.model";
import { CollaboratorStatus } from "./collaborators/collaborator.enum";
import { Collaborator } from "./collaborators/collaborator.model";
import { PhaseType } from "./phase/phase.enum";
import { Phase } from "./phase/phase.model";
import { ProjectStatus } from "./project.enum";
import { Project } from "./project.model";
import { CreateProjectDto } from "./project.service";
import { ProjectStageStatus } from "./stages/project.stage.enum";
import { ProjectStage } from "./stages/project.stage.model";
import { CreateProjectStageDto } from "./stages/project.stage.service";
import { ProjectTheme } from "./themes/project.theme.model";

export class ProService {
    private static async validateProject(project: CreateProjectDto) {
        const call = await Call.findOne({ _id: project.call, status: CallStatus.active }).lean();
        if (!call) throw new Error("Call not found");

        return call;
    }
    static async submitProject(dto: CreateProjectDto) {
        if (!dto.documentPath) {
            throw new Error("Document path not found");
        }
        const call = await this.validateProject(dto);
        await ConstraintValidator.validateProjectConstraints(call.grant, dto);
        await ConstraintValidator.validateApplicantConstraints(call.grant, dto);
        //Find the first stage
        //const stage = await Stage.findOne({ parent: call.evaluation, order: 1 }).lean();
        //if (!stage) throw new Error("Stage not found");

        //Check collaborator applicants
        let hasLeadPI = false;
        for (const collaborator of dto.collaborators ?? []) {
            const applicant = await Applicant.findById(collaborator.applicant).lean();
            if (!applicant) {
                throw new Error(`Applicant not found: ${collaborator.applicant}`);
            }
            if (collaborator.isLeadPI) {
                if (hasLeadPI) {
                    throw new Error("A project can have only one Lead PI");
                }
                hasLeadPI = true;
            }
        }
        if (!hasLeadPI) {
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
            //stage: stage._id,
            documentPath: dto.documentPath,
            status: ProjectStageStatus.submitted
        }
        await Collaborator.insertMany(collaborators);
        await ProjectTheme.insertMany(themes);
        await Phase.insertMany(phases);
        await ProjectStage.create(projectStage);
        return submittedProject;
    }
}