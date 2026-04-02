import { Router } from 'express';
import { PERMISSIONS } from '../../common/constants/permissions';
import { IOrganizationRepository, OrganizationRepository } from '../organization/organization.repository';
import { IThematicRepository, ThematicRepository } from '../thematics/thematic.repository';
import { checkPermission, checkTransitionPermission, verifyActiveAccount } from '../users/auth/auth.middleware';
import { GrantAllocationRepository } from './allocations/grant.allocation.repository';
import { CompositionRepository, ICompositionRepository } from './compositions/composition.repository';
import { ConstraintRepository, IConstraintRepository } from './constraints/constraint.repository';
import { GrantController } from './grant.controller';
import { GrantRepository } from './grant.repository';
import { GrantService } from './grant.service';
import { GrantStageRepository, IGrantStageRepository } from './stages/grant.stage.repository';

const repository: GrantRepository = new GrantRepository();
const organizationRepo: IOrganizationRepository = new OrganizationRepository();
const thematicRepository: IThematicRepository = new ThematicRepository();
const constraintRepo: IConstraintRepository = new ConstraintRepository();
const compositionRepo: ICompositionRepository = new CompositionRepository();
const grantStageRepo: IGrantStageRepository = new GrantStageRepository();
const allocationRepo = new GrantAllocationRepository()

const service = new GrantService(repository, organizationRepo, thematicRepository, constraintRepo,
  compositionRepo, grantStageRepo, allocationRepo
);
const controller = new GrantController(service);
const router = Router();

router.post(
  '/',
  verifyActiveAccount,
  checkPermission([PERMISSIONS.GRANT.CREATE]),
  controller.create
);

router.get(
  '/',
  verifyActiveAccount,
  checkPermission([
    PERMISSIONS.GRANT.READ
  ]),
  controller.get
);

/*
router.get('/:id', verifyActiveAccount,
  checkPermission([PERMISSIONS.GRANT.READ]),
  controller.getById);
  */

router.put(
  '/:id',
  verifyActiveAccount,
  checkPermission([PERMISSIONS.GRANT.UPDATE]),
  controller.update
);

router.patch(
  '/:id', verifyActiveAccount,
  checkTransitionPermission("grant"),
  controller.transitionState
);

router.delete(
  '/:id',
  verifyActiveAccount,
  checkPermission([PERMISSIONS.GRANT.DELETE]),
  controller.delete
);

export default router;
