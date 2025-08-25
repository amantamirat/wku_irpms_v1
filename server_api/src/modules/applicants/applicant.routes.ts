import { Router } from 'express';
import { verifyActiveAccount } from '../../middleware/auth';
import { ApplicantController } from './applicant.controller';


const router: Router = Router();

router.post('/', verifyActiveAccount, ApplicantController.createApplicant);
router.get('/', verifyActiveAccount, ApplicantController.getApplicants);
router.put('/:id', verifyActiveAccount, ApplicantController.updateApplicant);
router.delete('/:id', verifyActiveAccount, ApplicantController.deleteApplicant);

export default router;
