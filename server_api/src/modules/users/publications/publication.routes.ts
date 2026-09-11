import { Router } from 'express';
import { PublicationController } from './publication.controller';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { PublicationService } from './publication.service';
import { PublicationRepository } from './publication.repository';
import { verifyAuthToken } from '../../auth/auth.middleware';
import { checkTransitionPermission } from '../../../core/container';
import { checkPermission } from '../../../core/container';
import { UserRepository } from '../user.repository';

const publicationRepository = new PublicationRepository();
const applicantRepository = new UserRepository();

const service = new PublicationService(
    publicationRepository,
    applicantRepository
);

const controller = new PublicationController(service);
const router: Router = Router();

router.post('/',
    verifyAuthToken,
    checkPermission([PERMISSIONS.PUBLICATION.CREATE]),
    controller.create
);

router.get('/',
    verifyAuthToken,
    checkPermission([PERMISSIONS.PUBLICATION.READ]),
    controller.get
);

router.put('/:id',
    verifyAuthToken,
    checkPermission([PERMISSIONS.PUBLICATION.UPDATE]),
    controller.update
);

router.patch('/:id', verifyAuthToken,
    checkTransitionPermission("publication"),
    controller.transitionState);

router.delete('/:id',
    verifyAuthToken,
    checkPermission([PERMISSIONS.PUBLICATION.DELETE]),
    controller.delete
);

export default router;
