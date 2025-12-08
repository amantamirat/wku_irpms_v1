import { Router } from 'express';
import { RoleController } from './role.controller';
import { checkPermission, verifyActiveAccount } from '../user.middleware';
import { PERMISSIONS } from '../../../util/permissions';


const router: Router = Router();

router.post('/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.ROLE.CREATE]),
    RoleController.createRole
);

router.get('/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.ROLE.READ]),
    RoleController.getRoles
);

router.put('/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.ROLE.UPDATE]),
    RoleController.updateRole
);

router.delete('/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.ROLE.DELETE]),
    RoleController.deleteRole
);

export default router;
