import { Router } from 'express';
import {RoleController} from './role.controller';
import { verifyActiveAccount } from '../../../middleware/auth';


const router: Router = Router();

router.post('/', verifyActiveAccount, RoleController.createRole);
router.get('/', verifyActiveAccount, RoleController.getRoles);
router.put('/:id', verifyActiveAccount, RoleController.updateRole);
router.delete('/:id', verifyActiveAccount, RoleController.deleteRole);

export default router;
