import { Router } from 'express';
import { PERMISSIONS } from '../../common/constants/permissions';
import { projectService } from '../../core/container';
import { upload } from '../../util/multer';
import { checkPermission, checkTransitionPermission, verifyActiveAccount } from '../auth/auth.middleware';
import { ProjectController } from './project.controller';

/*
const projectRepo = new ProjectRepository();
const projAuth = new ProjectAuth(projectRepo);
const grantAllocRepo = new GrantAllocationRepository();
const callRepo = new CallRepository();
const callStageRepo = new StageRepository();
const appRepo = new UserRepository();
const collabRepo = new CollaboratorRepository();
const phaseRepo = new PhaseRepository();
const projStageRepo = new ApplicationRepository();
const grantStageRepo = new GrantStageRepository();

const notificationService = new NotificationService(
    new NotificationRepository(),
    new SettingService(new SettingRepository())
);

const synchronizer = new ProjectStageSynchronizer(projectRepo, projStageRepo, grantStageRepo);


const constValidator = new ConstraintValidator(new ConstraintRepository(), new ThemeRepository());
//const collabService = new CollaboratorService(collabRepo, projectRepo, projAuth, appRepo, constValidator, notificationService);

const projectStageService = new ApplicationService(
    projStageRepo, projAuth, grantStageRepo,
    callStageRepo, new ReviewerRepository(), synchronizer, notificationService
);
*/

const controller = new ProjectController(projectService);
const router: Router = Router();

//create


router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT.CREATE]),
    controller.create);

router.post(
    "/apply",
    verifyActiveAccount,
    // checkPermission("project:apply"),
    (req, res, next) => {
        // Set the dynamic subfolder for this specific endpoint
        req.headers["x-upload-folder"] = "applications";
        next();
    },
    upload.single("file"),
    controller.apply
);

router.post(
    '/from-grant',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT.CREATE]),
    controller.create
);

router.get('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT.READ]),
    controller.get);

router.get('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT.READ]),
    controller.getById);

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
