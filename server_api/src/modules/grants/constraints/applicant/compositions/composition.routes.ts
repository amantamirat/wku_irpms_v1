import { Router } from 'express';
import { CompositionController } from './composition.controller';
import { PERMISSIONS } from '../../../../../common/constants/permissions';
import { verifyActiveAccount, checkPermission } from '../../../../users/user.middleware';

const router: Router = Router();

router.post(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.CONSTRAINT.CREATE]),
    CompositionController.createComposition
);

router.get(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.CONSTRAINT.READ]),
    CompositionController.getCompositions
);

router.put(
    '/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.CONSTRAINT.UPDATE]),
    CompositionController.updateComposition
);

router.delete(
    '/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.CONSTRAINT.DELETE]),
    CompositionController.deleteComposition
);

export default router;
