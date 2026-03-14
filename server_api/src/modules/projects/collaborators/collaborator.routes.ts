import { Router } from 'express';
import { CollaboratorController } from './collaborator.controller';
import { checkPermission, checkStatusPermission, verifyActiveAccount } from '../../users/auth/auth.middleware';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { CollaboratorRepository } from './collaborator.repository';
import { CollaboratorService } from './collaborator.service';
import { ProjectRepository } from '../project.repository';
import { ApplicantRepository } from '../../applicants/applicant.repository';

const repository = new CollaboratorRepository();
const proRepository = new ProjectRepository();
const appRepository = new ApplicantRepository();

const service = new CollaboratorService(repository, proRepository, appRepository)
const controller = new CollaboratorController(service);
const router: Router = Router();

router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.COLLABORATOR.CREATE]),
    controller.create);
router.get('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.COLLABORATOR.READ]),
    controller.get);
/*    
router.put('/', verifyActiveAccount, 
    checkPermission([PERMISSIONS.COLLABORATOR.UPDATE]),
    controller.update);
*/
router.patch('/:id', verifyActiveAccount,
    checkStatusPermission("collaborator"),
    controller.updateStatus);

router.delete('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.COLLABORATOR.DELETE]),
    controller.delete);

export default router;
