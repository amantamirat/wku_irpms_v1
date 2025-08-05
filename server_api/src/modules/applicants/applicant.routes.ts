import { Router } from 'express';
import applicantController from './applicant.controller';
import { verifyActiveAccount } from '../../middleware/auth';
const router: Router = Router();


router.post('/', verifyActiveAccount, applicantController.createApplicant);
router.get('/:scope', verifyActiveAccount, applicantController.getApplicants);
router.put('/:id', verifyActiveAccount, applicantController.updateApplicant);
router.delete('/:id', verifyActiveAccount, applicantController.deleteApplicant);

export default router;
