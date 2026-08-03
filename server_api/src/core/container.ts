// container.ts
import { CalendarRepository } from "../modules/calendar/calendar.repository";
import { CallRepository } from "../modules/calls/call.repository";
import { StageRepository } from "../modules/calls/stages/stage.repository";
import { ConstraintRepository } from "../modules/constraints/constraint.repository";
import { ConstraintValidationService } from "../modules/constraints/services/constraint-validator.service";
import { EvaluationRepository } from "../modules/evaluations/evaluation.repository";
import { CompositionRepository } from "../modules/grants/compositions/composition.repository";
import { CompositionValidator } from "../modules/grants/compositions/composition.validator";
import { ConstraintRepositoryOLD } from "../modules/grants/constraints/constraint.repository";
import { ConstraintValidatorOLD } from "../modules/grants/constraints/constraint.validator";
import { GrantRepository } from "../modules/grants/grant.repository";
import { OrganizationRepository } from "../modules/organization/organization.repository";
import { SpecializationRepository } from "../modules/organization/specializations/specialization.repository";
import { RoleRepository } from "../modules/permissions/roles/role.repository";
import { ApplicationRepository } from "../modules/projects/applications/application.repository";
import { ApplicationService } from "../modules/projects/applications/application.service";
import { CollaboratorRepository } from "../modules/projects/collaborators/collaborator.repository";
import { CollaboratorService } from "../modules/projects/collaborators/collaborator.service";
import { PhaseRepository } from "../modules/projects/phase/phase.repository";
import { PhaseService } from "../modules/projects/phase/phase.service";
import { ProjectRepository } from "../modules/projects/project.repository";
import { ProjectService } from "../modules/projects/project.service";
import { ReviewerRepository } from "../modules/reviewers/reviewer.repository";
import { PdfExtractorService } from "../modules/templates/services/pdf-extractor.service";
import { TemplateValidationService } from "../modules/templates/services/template-validation.service";
import { TemplateParserService } from "../modules/templates/services/template.parser.service";
import { TemplateRepository } from "../modules/templates/template.repository";
import { ThematicRepository } from "../modules/thematics/thematic.repository";
import { ThemeRepository } from "../modules/thematics/themes/theme.repository";
import { ExperienceRepository } from "../modules/users/experiences/experience.repository";
import { UserRepository } from "../modules/users/user.repository";
import { UserService } from "../modules/users/user.service";

// calendar repos
export const calendarRepo = new CalendarRepository();
// organization repos
export const organizationRepo = new OrganizationRepository();
//user repos
export const userRepo = new UserRepository();
export const exprienceRepo = new ExperienceRepository();
export const specializationRepo = new SpecializationRepository();
//account repos
export const roleRepo = new RoleRepository();
//grant repos
export const grantRepo = new GrantRepository();
export const thematicRepo = new ThematicRepository();
export const themeRepo = new ThemeRepository();
export const constraintRepo = new ConstraintRepository();

export const constraintRepoOld = new ConstraintRepositoryOLD();
export const compositionRepo = new CompositionRepository();
// project repos
export const projectRepo = new ProjectRepository();
export const collaboratorRepo = new CollaboratorRepository();
export const phaseRepo = new PhaseRepository();
//call repos
export const callRepo = new CallRepository();
export const stageRepo = new StageRepository();
export const evalRepo = new EvaluationRepository();
export const applicationRepo = new ApplicationRepository();
export const reviewerRepo = new ReviewerRepository();

export const templateRepo = new TemplateRepository();
export const templateValidtor = new TemplateValidationService(
    new PdfExtractorService(), new TemplateParserService(), templateRepo
);


//validator services 
export const constraintValidator = new ConstraintValidationService(constraintRepo, themeRepo);

//grant validators
export const constraintValidatorOLD = new ConstraintValidatorOLD(constraintRepoOld, themeRepo);
export const compositionValidator = new CompositionValidator(compositionRepo, userRepo, exprienceRepo, specializationRepo, collaboratorRepo);

// Services
export const collabService = new CollaboratorService(collaboratorRepo, projectRepo, constraintValidatorOLD, compositionValidator);
export const phaseService = new PhaseService(phaseRepo, projectRepo, grantRepo, constraintValidatorOLD);
export const projectService = new ProjectService(projectRepo, collaboratorRepo, phaseRepo, grantRepo,
    collabService, phaseService, constraintValidatorOLD, compositionValidator
);
export const applicationService = new ApplicationService(applicationRepo, projectRepo, grantRepo, callRepo, stageRepo, reviewerRepo,
    projectService, compositionValidator, constraintValidator, templateValidtor);

export const userService = new UserService(userRepo, organizationRepo, roleRepo);

