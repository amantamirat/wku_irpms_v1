import { Router } from 'express';
import { PERMISSIONS } from '../../common/constants/permissions';
import { checkPermission, checkTransitionPermission, verifyActiveAccount } from '../users/auth/auth.middleware';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { ProjectRepository } from './project.repository';
import { GrantAllocationRepository } from '../grants/allocations/grant.allocation.repository';
import { ApplicantRepository } from '../applicants/applicant.repository';
import { CollaboratorRepository } from './collaborators/collaborator.repository';
import { PhaseRepository } from './phase/phase.repository';

const projectRepo = new ProjectRepository();
const grantAllocRepo = new GrantAllocationRepository();
const appRepo = new ApplicantRepository();
const collabRepo = new CollaboratorRepository();
const phaseRepo = new PhaseRepository();

const service = new ProjectService(projectRepo, grantAllocRepo, appRepo, collabRepo, phaseRepo);
const controller = new ProjectController(service);
const router: Router = Router();

//create
router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT.CREATE]),
    controller.create);

router.get('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT.READ]),
    controller.get);

//update    
router.put('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT.UPDATE]),
    controller.update);

//update status
router.patch('/:id', verifyActiveAccount,
    checkTransitionPermission("project"),
    controller.transitionState);

//delete
router.delete('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.PROJECT.DELETE]),
    controller.delete);

export default router;
