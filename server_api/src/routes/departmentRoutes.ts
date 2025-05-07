import { Router } from 'express';
import departmentController from '../controllers/departmentController';
const router: Router = Router();
import { authenticateToken } from "../middleware/auth";

router.post('/', authenticateToken, departmentController.createDepartment);
router.get('/', authenticateToken, departmentController.getAllDepartments);
router.get('/:id', authenticateToken, departmentController.getDepartmentById);
router.put('/:id', authenticateToken, departmentController.updateDepartment);
router.delete('/:id', authenticateToken, departmentController.deleteDepartment);

export default router;
