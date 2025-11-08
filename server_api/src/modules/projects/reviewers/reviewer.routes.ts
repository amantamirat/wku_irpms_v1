import { Router } from 'express';
import { ReviewerController } from './reviewer.controller';
import { verifyActiveAccount } from '../../users/auth/auth.middleware';

const router: Router = Router();

router.post('/', verifyActiveAccount, ReviewerController.createReviewer);
router.get('/', verifyActiveAccount, ReviewerController.getReviewers);
router.put('/:id', verifyActiveAccount, ReviewerController.updateReviewer);
router.delete('/:id', verifyActiveAccount, ReviewerController.deleteReviewer);

export default router;
