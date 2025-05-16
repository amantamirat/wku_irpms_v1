import { Router } from 'express';
import roleController from '../controllers/role.controller';
import { verifyActiveAccount } from '../middleware/auth';

const router: Router = Router();

router.post('/', verifyActiveAccount, roleController.createRole);
router.get('/', verifyActiveAccount, roleController.getAllRoles);
router.put('/:id', verifyActiveAccount, roleController.updateRole);
router.delete('/:id', verifyActiveAccount, roleController.deleteRole);

export default router;
