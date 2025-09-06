import { Router } from 'express';
import {UserController} from './user.controller';
import { verifyActiveAccount } from '../../middleware/auth';

const router: Router = Router();

router.post('/', verifyActiveAccount, UserController.createUser);
router.get('/', verifyActiveAccount, UserController.getUsers);
router.put('/:id', verifyActiveAccount, UserController.updateUser);
router.delete('/:id', verifyActiveAccount, UserController.deleteUser);

export default router;
