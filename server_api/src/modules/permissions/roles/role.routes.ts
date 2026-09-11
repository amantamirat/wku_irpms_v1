import { Router } from 'express';
import { RoleController } from './role.controller';

import { PERMISSIONS } from '../../../common/constants/permissions';
import { roleRepo } from '../../../core/container';
import { verifyAuthToken } from '../../auth/auth.middleware';
import { checkPermission } from '../../../core/container';
import { RoleService } from './role.service';

const service = new RoleService(roleRepo);
const controller = new RoleController(service);
const router: Router = Router();

router.post('/',
    verifyAuthToken,
    checkPermission([PERMISSIONS.ROLE.CREATE]),
    controller.create
);

router.get('/',
    verifyAuthToken,
    checkPermission([PERMISSIONS.ROLE.READ]),
    controller.get
);

router.put('/:id',
    verifyAuthToken,
    checkPermission([PERMISSIONS.ROLE.UPDATE]),
    controller.update
);

router.delete('/:id',
    verifyAuthToken,
    checkPermission([PERMISSIONS.ROLE.DELETE]),
    controller.delete
);

export default router;
