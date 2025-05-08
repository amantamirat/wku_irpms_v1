import { Router } from 'express';
import programController from '../controllers/programController';
const router: Router = Router();
import { authenticateToken } from "../middleware/auth";

router.post('/', authenticateToken, programController.createProgram);
router.get('/', authenticateToken, programController.getAllPrograms);
router.get('/:id', authenticateToken, programController.getProgramsByDepartment);
router.put('/:id', authenticateToken, programController.updateProgram);
router.delete('/:id', authenticateToken, programController.deleteProgram);

export default router;
