import { Router } from 'express';
import { ReviewerController } from './reviewer.controller';
import { checkPermission, checkStatusPermission, verifyActiveAccount } from '../../../../users/user.middleware';
import { PERMISSIONS } from '../../../../../common/constants/permissions';

const router: Router = Router();

router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.REVIEWER.CREATE]),
    ReviewerController.createReviewer);
router.get('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.REVIEWER.READ]),
    ReviewerController.getReviewers);
router.put('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.REVIEWER.UPDATE]),
    ReviewerController.updateReviewer);
router.put('/:id/status', verifyActiveAccount,
    //checkPermission([PERMISSIONS.REVIEWER.CHANGE_STATUS, PERMISSIONS.REVIEWER.APPROVE]),
    ReviewerController.updateStatus);

router.patch('/:id', verifyActiveAccount,
    checkStatusPermission("reviewer"),
    ReviewerController.updateStatus);
router.delete('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.REVIEWER.DELETE]),
    ReviewerController.deleteReviewer);

export default router;
