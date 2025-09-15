import { Router } from 'express';
import {UserController} from './user.controller';
import { verifyActiveAccount } from './auth/auth.middleware';

const router: Router = Router();

router.post('/', verifyActiveAccount, UserController.createUser);
router.post('/:id', verifyActiveAccount, UserController.linkUser);
router.get('/', verifyActiveAccount, UserController.getUsers);
router.put('/:id', verifyActiveAccount, UserController.updateUser);
router.delete('/:id', verifyActiveAccount, UserController.deleteUser);

export default router;
