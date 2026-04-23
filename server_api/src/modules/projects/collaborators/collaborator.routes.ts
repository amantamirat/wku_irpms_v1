import { Router } from 'express';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { ApplicantRepository } from '../../applicants/applicant.repository';
import { SettingRepository } from '../../settings/setting.repository';
import { SettingService } from '../../settings/setting.service';
import { checkPermission, checkTransitionPermission, verifyActiveAccount } from '../../users/auth/auth.middleware';
import { NotificationRepository } from '../../users/notifications/notification.repository';
import { NotificationService } from '../../users/notifications/notification.service';
import { ProjectRepository } from '../project.repository';
import { CollaboratorController } from './collaborator.controller';
import { CollaboratorRepository } from './collaborator.repository';
import { CollaboratorService } from './collaborator.service';
import { ConstraintRepository } from '../../grants/constraints/constraint.repository';
import { ConstraintValidator } from '../../grants/constraints/constraint.validator';
import { ThemeRepository } from '../../thematics/themes/theme.repository';
import { ProjectAuth } from '../project.auth';

const repository = new CollaboratorRepository();
const projectRepo = new ProjectRepository();
const projAuth = new ProjectAuth(projectRepo);
const appRepository = new ApplicantRepository();
const notificationService = new NotificationService(
    new NotificationRepository(),
    new SettingService(new SettingRepository())
);
const constValidator = new ConstraintValidator(new ConstraintRepository(), new ThemeRepository());

const service = new CollaboratorService(
    repository, projectRepo, projAuth, appRepository, constValidator, notificationService
)
const controller = new CollaboratorController(service);
const router: Router = Router();

router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.COLLABORATOR.CREATE]),
    controller.create);
router.get('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.COLLABORATOR.READ]),
    controller.get);

router.put('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.COLLABORATOR.UPDATE]),
    controller.update);

router.patch('/:id', verifyActiveAccount,
    checkTransitionPermission("collaborator"),
    controller.transitionState);

router.delete('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.COLLABORATOR.DELETE]),
    controller.delete);

export default router;
