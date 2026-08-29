import { Router } from 'express';
import { RoleController } from './role.controller';

import { PERMISSIONS } from '../../../common/constants/permissions';
import { roleRepo } from '../../../core/container';
import { checkPermission, verifyActiveAccount } from '../../auth/auth.middleware';
import { RoleService } from './role.service';

const service = new RoleService(roleRepo);
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
