import { Router } from 'express';
import programController from '../controllers/programController';
const router: Router = Router();
import { verifyActiveAccount } from "../middleware/auth";

router.post('/', verifyActiveAccount, programController.createProgram);
router.get('/', verifyActiveAccount, programController.getAllPrograms);
router.get('/:id', verifyActiveAccount, programController.getProgramsByDepartment);
router.put('/:id', verifyActiveAccount, programController.updateProgram);
router.delete('/:id', verifyActiveAccount, programController.deleteProgram);

export default router;
