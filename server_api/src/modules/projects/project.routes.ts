import { Router } from 'express';
import { PERMISSIONS } from '../../common/constants/permissions';
import { checkPermission, checkTransitionPermission, verifyActiveAccount } from '../auth/auth.middleware';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { ProjectRepository } from './project.repository';
import { GrantAllocationRepository } from '../grants/allocations/grant.allocation.repository';
import { ApplicantRepository } from '../applicants/applicant.repository';
import { CollaboratorRepository } from './collaborators/collaborator.repository';
import { PhaseRepository } from './phase/phase.repository';
import { CallRepository } from '../calls/call.repository';
import { upload } from '../../util/multer';
import { CollaboratorService } from './collaborators/collaborator.service';
import { NotificationService } from '../notifications/notification.service';
import { NotificationRepository } from '../notifications/notification.repository';
import { SettingService } from '../settings/setting.service';
import { SettingRepository } from '../settings/setting.repository';
import { ConstraintRepository } from '../grants/constraints/constraint.repository';
import { ThemeRepository } from '../thematics/themes/theme.repository';
import { ConstraintValidator } from '../grants/constraints/constraint.validator';
import { ProjectStageRepository } from './stages/project.stage.repository';
import { CallStageRepository } from '../calls/stages/call.stage.repository';
import { ProjectStageSynchronizer } from './stages/project.stage.synchronizer';
import { ProjectAuth } from './project.auth';


const projectRepo = new ProjectRepository();
const grantAllocRepo = new GrantAllocationRepository();
const callRepo = new CallRepository();
const callStageRepo = new CallStageRepository();
const appRepo = new ApplicantRepository();
const collabRepo = new CollaboratorRepository();
const phaseRepo = new PhaseRepository();
const projStageRepo = new ProjectStageRepository();

const projAuth = new ProjectAuth(projectRepo);
const notificationService = new NotificationService(
    new NotificationRepository(),
    new SettingService(new SettingRepository())
);

const synchronizer = new ProjectStageSynchronizer(projectRepo, projStageRepo);


const constValidator = new ConstraintValidator(new ConstraintRepository(), new ThemeRepository());
const collabService = new CollaboratorService(collabRepo, projectRepo, projAuth, appRepo, constValidator, notificationService);

const service = new ProjectService(projectRepo, projAuth, grantAllocRepo, callRepo, callStageRepo, collabRepo, phaseRepo, projStageRepo,
    synchronizer,
    collabService, constValidator);
const controller = new ProjectController(service);
const router: Router = Router();

//create
router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT.CREATE]),
    controller.create);

router.post("/apply", verifyActiveAccount,
    //checkPermission("project:apply"),
    upload.single("file"), controller.apply);

router.get('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT.READ]),
    controller.get);

//update    
router.put('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT.UPDATE]),
    controller.update);

//update status
router.patch('/:id', verifyActiveAccount,
    checkTransitionPermission("project"),
    controller.transitionState);

//delete
router.delete('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT.DELETE]),
    controller.delete);

export default router;
