import { Router } from 'express';
import departmentController from '../controllers/departmentController';
const router: Router = Router();
import { verifyActiveAccount } from "../middleware/auth";

router.post('/', verifyActiveAccount, departmentController.createDepartment);
router.get('/', verifyActiveAccount, departmentController.getAllDepartments);
router.put('/:id', verifyActiveAccount, departmentController.updateDepartment);
router.delete('/:id', verifyActiveAccount, departmentController.deleteDepartment);

export default router;
