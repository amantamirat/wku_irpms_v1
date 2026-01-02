import { Router } from 'express';
import { ResultController } from './result.controller';
import { PERMISSIONS } from '../../../../../common/constants/permissions';
import { verifyActiveAccount, checkPermission } from '../../../../users/user.middleware';

const router: Router = Router();

router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.RESULT.CREATE]),
    ResultController.createResult);
router.get('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.RESULT.READ]),
    ResultController.getResults);
router.put('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.RESULT.UPDATE]),
    ResultController.updateResult);
router.delete('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.RESULT.DELETE]),
    ResultController.deleteResult);

export default router;
