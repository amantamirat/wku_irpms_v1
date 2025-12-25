import { Router } from 'express';
import { RoleController } from './role.controller';
import { checkPermission, verifyActiveAccount } from '../user.middleware';
import { PERMISSIONS } from '../../../common/constants/permissions';

const controller = new RoleController();
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
