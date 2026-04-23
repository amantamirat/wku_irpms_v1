import { Router } from 'express';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { checkPermission, verifyActiveAccount } from '../../auth/auth.middleware';
import { GrantRepository, IGrantRepository } from '../grant.repository';
import { ConstraintController } from './constraint.controller';
import { ConstraintRepository } from './constraint.repository';
import { ConstraintService } from './constraint.service';


const repository = new ConstraintRepository();
const grantRepository: IGrantRepository = new GrantRepository();
const service = new ConstraintService(repository, grantRepository);
const controller = new ConstraintController(service);

const router: Router = Router();

router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.CONSTRAINT.CREATE]),
    controller.create);
router.get('/', verifyActiveAccount, checkPermission([
    PERMISSIONS.CONSTRAINT.READ
]), controller.get);
router.put('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.CONSTRAINT.UPDATE]),
    controller.update);
router.delete('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.CONSTRAINT.DELETE]),
    controller.delete);

export default router;
