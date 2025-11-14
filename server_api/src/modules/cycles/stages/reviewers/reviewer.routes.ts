import { Router } from 'express';
import { ReviewerController } from './reviewer.controller';
import { checkPermission, verifyActiveAccount } from '../../../users/auth/auth.middleware';
import { PERMISSIONS } from '../../../../util/permissions';

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
router.delete('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.REVIEWER.DELETE]),
    ReviewerController.deleteReviewer);

export default router;
