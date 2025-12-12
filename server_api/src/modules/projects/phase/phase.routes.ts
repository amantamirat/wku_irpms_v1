import { Router } from 'express';
import { PhaseController } from './phase.controller';
import { checkPermission, verifyActiveAccount } from '../../users/user.middleware';
import { PERMISSIONS } from '../../../common/constants/permissions';


const router: Router = Router();

router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PHASE.CREATE]),
    PhaseController.createPhase);
router.get('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PHASE.READ]),
    PhaseController.getPhases);
router.put('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.PHASE.UPDATE]),
    PhaseController.updatePhase);
router.delete('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.PHASE.DELETE]),
    PhaseController.deletePhase);

export default router;
