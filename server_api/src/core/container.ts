// container.ts
import { CalendarRepository } from "../modules/calendar/calendar.repository";
import { GrantRepository } from "../modules/grants/grant.repository";
import { OrganizationRepository } from "../modules/organization/organization.repository";
import { CollaboratorRepository } from "../modules/projects/collaborators/collaborator.repository";
import { NewCollaboratorService } from "../modules/projects/collaborators/new.collab.service";
import { NewProjectService } from "../modules/projects/new.project.service";
import { NewPhaseService } from "../modules/projects/phase/new.phase.service";
import { PhaseRepository } from "../modules/projects/phase/phase.repository";
import { ProjectRepository } from "../modules/projects/project.repository";
import { ThemeRepository } from "../modules/thematics/themes/theme.repository";
import { UserRepository } from "../modules/users/user.repository";

// organization repos
export const calendarRepo = new CalendarRepository();
// organization repos
export const organizationRepo = new OrganizationRepository();
//user repos
export const userRepo = new UserRepository();
//thematic repos
export const themeRepo = new ThemeRepository();
//grant repos
export const grantRepo = new GrantRepository();
// project repos
export const projectRepo = new ProjectRepository();
export const collaboratorRepo = new CollaboratorRepository();
export const phaseRepo = new PhaseRepository();

// Services
export const newCollaboratorService =
    new NewCollaboratorService(
        collaboratorRepo,
        projectRepo
    );

export const newPhaseService =
    new NewPhaseService(
        phaseRepo,
        projectRepo
    );

export const newProjectService =
    new NewProjectService(
        projectRepo,
        newCollaboratorService,
        newPhaseService
    );