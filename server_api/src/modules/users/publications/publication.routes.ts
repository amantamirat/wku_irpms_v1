import { Router } from 'express';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { checkPermission, checkTransitionPermission, publicationRepo, userRepo } from '../../../core/container';
import { verifyAuthToken } from '../../auth/auth.middleware';
import { PublicationController } from './publication.controller';
import { PublicationService } from './publication.service';



const service = new PublicationService(
    publicationRepo,
    userRepo
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

router.get('/lookup',
    verifyAuthToken,
    checkPermission([PERMISSIONS.PUBLICATION.LOOKUP]),
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
