import { Router } from 'express';
import { CompositionController } from './composition.controller';
import { PERMISSIONS } from '../../../../util/permissions';
import { verifyActiveAccount, checkPermission } from '../../../users/auth/auth.middleware';

const router: Router = Router();

router.post(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.GRANT.CREATE]),
    CompositionController.createComposition
);

router.get(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.GRANT.READ]),
    CompositionController.getCompositions
);

router.put(
    '/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.GRANT.UPDATE]),
    CompositionController.updateComposition
);

router.delete(
    '/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.GRANT.DELETE]),
    CompositionController.deleteComposition
);

export default router;
