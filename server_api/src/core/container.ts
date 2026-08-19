// container.ts
import { CalendarRepository } from "../modules/calendar/calendar.repository";
import { CallRepository } from "../modules/calls/call.repository";
import { StageRepository } from "../modules/calls/stages/stage.repository";
import { ConstraintRepository } from "../modules/constraints/constraint.repository";
import { ConstraintValidationService } from "../modules/constraints/services/constraint-validator.service";
import { EvaluationRepository } from "../modules/evaluations/evaluation.repository";
import { CompositionRepository } from "../modules/compositions/composition.repository";
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
import { ProfileRepository } from "../modules/compositions/profile/profile.repository";
import { HistoryRepository } from "../modules/compositions/history/history.repository";
import { RequirementRepository } from "../modules/compositions/requirements/requirement.repository";
import { ApplicationSynchronizer } from "../modules/projects/applications/application.synchronizer";
import { NotificationRepository } from "../modules/notifications/notification.repository";
import { SettingRepository } from "../modules/settings/setting.repository";
import { SettingService } from "../modules/settings/setting.service";
import { NotificationService } from "../modules/notifications/notification.service";
import { StageService } from "../modules/calls/stages/stage.service";
import { PhaseSynchronizer } from "../modules/projects/phase/phase.synchronizer";
import { AnonymizerService } from "../modules/anonymizer/anonymizer.service";
import { VerificationConfigurationRepository } from "../modules/grants/verification-conf/verification-conf.repository";
import { VerificationRepository } from "../modules/grants/verifications/verification.repository";

export const notificationRepo = new NotificationRepository();
export const settingRepo = new SettingRepository();
export const settingService = new SettingService(settingRepo);
export const notificationService = new NotificationService(notificationRepo, settingService);

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

export const profileRepo = new ProfileRepository();
export const historyRepo = new HistoryRepository();
export const requirementRepo = new RequirementRepository();
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

export const verificationConfRepo = new VerificationConfigurationRepository();
export const verificationRepo = new VerificationRepository();



export const templateRepo = new TemplateRepository();
export const templateValidtor = new TemplateValidationService(
    new PdfExtractorService(), new TemplateParserService(), templateRepo
);
//validator services 
export const constraintValidator = new ConstraintValidationService(
    constraintRepo, themeRepo);


// Services
//export const stageService = new StageService(stageRepo, callRepo, evalRepo);
export const collabService = new CollaboratorService(collaboratorRepo, projectRepo, callRepo, constraintValidator);

export const phaseService = new PhaseService(phaseRepo, projectRepo, grantRepo, callRepo, constraintValidator,
    new PhaseSynchronizer(projectRepo, phaseRepo)
);
export const projectService = new ProjectService(projectRepo, collaboratorRepo, phaseRepo,
    grantRepo, collabService, phaseService, callRepo, constraintValidator, notificationService);

export const applicationService = new ApplicationService(applicationRepo, callRepo, stageRepo, reviewerRepo,
    projectService, constraintValidator, templateValidtor,
    new ApplicationSynchronizer(projectRepo, applicationRepo, stageRepo),
    new AnonymizerService(applicationRepo, collaboratorRepo),
    notificationService);

export const userService = new UserService(userRepo, organizationRepo, roleRepo);

