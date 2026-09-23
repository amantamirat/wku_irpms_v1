// container.ts
import { createCheckPermission, createCheckTransitionPermission } from "../common/middleware/permission.middleware";
import { AccountRepository } from "../modules/accounts/account.repository";
import { AccountService } from "../modules/accounts/account.service";
import { AuthPermissionService } from "../modules/auth/auth.permission-service";
import ScopeFilterService from "../modules/auth/scope-filter.service";
import { CalendarRepository } from "../modules/calendar/calendar.repository";
import { CallRepository } from "../modules/calls/call.repository";
import { StageRepository } from "../modules/calls/stages/stage.repository";
import { StageService } from "../modules/calls/stages/stage.service";
import { CompositionValidationService } from "../modules/compositions/composition-validator.service";
import { CompositionRepository } from "../modules/compositions/composition.repository";
import { HistoryValidatorService } from "../modules/compositions/history/history-validator.service";
import { HistoryRepository } from "../modules/compositions/history/history.repository";
import { ProfileValidatorService } from "../modules/compositions/profile/profile-validator.service";
import { ProfileRepository } from "../modules/compositions/profile/profile.repository";
import { RequirementRepository } from "../modules/compositions/requirements/requirement.repository";
import { ConstraintRepository } from "../modules/constraints/constraint.repository";
import { ConstraintValidationService } from "../modules/constraints/services/constraint-validator.service";
import { CriterionRepository } from "../modules/evaluations/criteria/criterion.repository";
import { EvaluationRepository } from "../modules/evaluations/evaluation.repository";
import { GrantRepository } from "../modules/grants/grant.repository";
import { VerificationConfigurationRepository } from "../modules/grants/verification-conf/verification-conf.repository";
import { VerificationRepository } from "../modules/grants/verifications/verification.repository";
import { NotificationRepository } from "../modules/notifications/notification.repository";
import { NotificationService } from "../modules/notifications/notification.service";
import { OrganizationRepository } from "../modules/organization/organization.repository";
import { SpecializationRepository } from "../modules/organization/specializations/specialization.repository";
import { PermissionRepository } from "../modules/permissions/permission.repository";
import { RoleRepository } from "../modules/permissions/roles/role.repository";
import { PositionRepository } from "../modules/positions/position.repository";
import { ApplicationRepository } from "../modules/projects/applications/application.repository";
import { ApplicationService } from "../modules/projects/applications/application.service";
import { CollaboratorRepository } from "../modules/projects/collaborators/collaborator.repository";
import { CollaboratorService } from "../modules/projects/collaborators/collaborator.service";
import { PhaseRepository } from "../modules/projects/phase/phase.repository";
import { PhaseService } from "../modules/projects/phase/phase.service";
import { ProjectAuth } from "../modules/projects/project.auth";
import { ProjectRepository } from "../modules/projects/project.repository";
import { ProjectService } from "../modules/projects/project.service";
import { ReviewerRepository } from "../modules/reviewers/reviewer.repository";
import { SettingRepository } from "../modules/settings/setting.repository";
import { SettingService } from "../modules/settings/setting.service";
import { PdfExtractorService } from "../modules/templates/services/pdf-extractor.service";
import { TemplateValidationService } from "../modules/templates/services/template-validation.service";
import { TemplateParserService } from "../modules/templates/services/template.parser.service";
import { TemplateRepository } from "../modules/templates/template.repository";
import { ThematicRepository } from "../modules/thematics/thematic.repository";
import { ThemeRepository } from "../modules/thematics/themes/theme.repository";
import { EnrollmentRepository } from "../modules/users/enrollments/enrollment.repository";
import { ExperienceRepository } from "../modules/users/experiences/experience.repository";
import { UserRepository } from "../modules/users/user.repository";
import { UserService } from "../modules/users/user.service";
import { AnonymizerService } from "../util/anonymizer/anonymizer.service";

export const notificationRepo = new NotificationRepository();
export const settingRepo = new SettingRepository();
export const settingService = new SettingService(settingRepo);
export const notificationService = new NotificationService(notificationRepo, settingService);


// organization repos
export const organizationRepo = new OrganizationRepository();
//user repos
export const userRepo = new UserRepository();
export const exprienceRepo = new ExperienceRepository();
export const specializationRepo = new SpecializationRepository();
export const enrollmentRepo = new EnrollmentRepository();
export const positionRepo = new PositionRepository();
//roles and permissions repos
export const permissionRepo = new PermissionRepository();
export const roleRepo = new RoleRepository();
export const accountRepo = new AccountRepository();
export const accountService = new AccountService(accountRepo, userRepo, settingService);
//middleware and auth
export const authPermissionService = new AuthPermissionService(userRepo, roleRepo);
export const checkPermission = createCheckPermission(authPermissionService);
export const checkTransitionPermission = createCheckTransitionPermission(checkPermission);

// calendar repos
export const calendarRepo = new CalendarRepository();
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
export const evaluationRepo = new EvaluationRepository();
export const criterionRepo = new CriterionRepository();
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
    constraintRepo, themeRepo, projectRepo, phaseRepo);

export const profileValidator = new ProfileValidatorService(
    exprienceRepo, specializationRepo
);

export const historyValidator = new HistoryValidatorService(
    applicationRepo, projectRepo, collaboratorRepo, grantRepo
);

//validator services 
export const compositionValidator = new CompositionValidationService(
    compositionRepo,
    grantRepo,
    projectRepo,
    userRepo,
    collaboratorRepo,
    new ProfileRepository(),
    new HistoryRepository(),
    new RequirementRepository(),
    profileValidator, historyValidator);


// Services
export const stageService = new StageService(stageRepo, callRepo, evaluationRepo, applicationRepo);

export const projectAuth = new ProjectAuth(projectRepo, authPermissionService);

export const collabService = new CollaboratorService(collaboratorRepo, projectRepo, callRepo,
    applicationRepo, constraintValidator, projectAuth, notificationService);

export const phaseService = new PhaseService(phaseRepo, projectRepo, grantRepo, callRepo, constraintValidator,
    projectAuth);

export const filterService = new ScopeFilterService(projectRepo);

export const applicationService = new ApplicationService(
    applicationRepo, projectRepo, callRepo, stageRepo, reviewerRepo,
    templateValidtor,
    new AnonymizerService(applicationRepo, collaboratorRepo), projectAuth,
    notificationService, filterService, compositionValidator
);

export const projectService = new ProjectService(projectRepo, userRepo, collaboratorRepo, phaseRepo, verificationRepo,
    grantRepo, callRepo, stageRepo,
    collabService, phaseService, applicationService,
    constraintValidator, compositionValidator, templateValidtor, projectAuth,
    authPermissionService, notificationService, filterService);

export const userService = new UserService(userRepo, organizationRepo, roleRepo);


