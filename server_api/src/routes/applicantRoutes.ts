import { Router } from 'express';
import applicantController from '../controllers/applicantController';
const router: Router = Router();
import { verifyActiveAccount } from "../middleware/auth";

router.post('/', verifyActiveAccount, applicantController.createApplicant);
router.get('/', verifyActiveAccount, applicantController.getAllApplicants);
router.get('/:scope', verifyActiveAccount, applicantController.getAllApplicantsByScope);
router.put('/:id', verifyActiveAccount, applicantController.updateApplicant);
router.delete('/:id', verifyActiveAccount, applicantController.deleteApplicant);

export default router;
