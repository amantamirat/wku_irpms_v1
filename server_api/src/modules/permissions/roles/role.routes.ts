import { Router } from 'express';
import { RoleController } from './role.controller';

import { PERMISSIONS } from '../../../common/constants/permissions';
import { RoleService } from './role.service';
import { RoleRepository } from './role.repository';
import { verifyActiveAccount, checkPermission } from '../../users/auth/auth.middleware';


const repository = new RoleRepository();
const service = new RoleService(repository);
const controller = new RoleController(service);
const router: Router = Router();

router.post('/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.ROLE.CREATE]),
    controller.create
);

router.get('/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.ROLE.READ]),
    controller.get
);

router.put('/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.ROLE.UPDATE]),
    controller.update
);

router.delete('/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.ROLE.DELETE]),
    controller.delete
);

export default router;
