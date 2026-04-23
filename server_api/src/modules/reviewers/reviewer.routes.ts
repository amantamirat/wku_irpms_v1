import { Router } from 'express';
import { ReviewerController } from './reviewer.controller';
import { checkPermission, checkTransitionPermission, verifyActiveAccount } from '../auth/auth.middleware';
import { PERMISSIONS } from '../../common/constants/permissions';
import { ReviewerRepository } from './reviewer.repository';
import { ApplicantRepository } from '../applicants/applicant.repository';
import { CollaboratorRepository } from '../projects/collaborators/collaborator.repository';
import { ProjectStageRepository } from '../projects/stages/project.stage.repository';
import { SettingRepository } from '../settings/setting.repository';
import { SettingService } from '../settings/setting.service';
import { ReviewerService } from './reviewer.service';
import { CriterionRepository } from '../evaluations/criteria/criterion.repository';
import { ResultRepository } from './results/result.repository';
import { ReviewerSynchronizer } from './reviewer.synchronizer';
import { NotificationService } from '../notifications/notification.service';
import { NotificationRepository } from '../notifications/notification.repository';

const repo = new ReviewerRepository();
const psRepo = new ProjectStageRepository();
const appRepo = new ApplicantRepository();
const collabRepo = new CollaboratorRepository();
const resultRepo = new ResultRepository();
const criterionRepo = new CriterionRepository();
const synchronizer = new ReviewerSynchronizer(repo, psRepo);
const notificationService = new NotificationService(
    new NotificationRepository(),
    new SettingService(new SettingRepository())
);
const service = new ReviewerService(
    repo, psRepo, appRepo, collabRepo, resultRepo, criterionRepo, synchronizer, notificationService);
const controller = new ReviewerController(service);
const router: Router = Router();

router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.REVIEWER.CREATE]),
    controller.create);
router.get('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.REVIEWER.READ]),
    controller.get);
router.put('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.REVIEWER.UPDATE]),
    controller.update);

router.patch('/:id', verifyActiveAccount,
    checkTransitionPermission("reviewer"),
    controller.transitionState);

router.delete('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.REVIEWER.DELETE]),
    controller.delete);

export default router;
