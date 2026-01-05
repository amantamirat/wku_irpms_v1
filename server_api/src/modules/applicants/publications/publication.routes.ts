import { Router } from 'express';
import { PublicationController } from './publication.controller';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { PublicationService } from './publication.service';
import { PublicationRepository } from './publication.repository';
import { verifyActiveAccount, checkPermission } from '../../users/user.middleware';
import { ApplicantRepository } from '../applicant.repository';

const publicationRepository = new PublicationRepository();
const applicantRepository = new ApplicantRepository();

const service = new PublicationService(
    publicationRepository,
    applicantRepository
);

const controller = new PublicationController(service);
const router: Router = Router();

router.post('/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.PUBLICATION.CREATE]),
    controller.create
);

router.get('/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.PUBLICATION.READ]),
    controller.get
);

router.put('/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.PUBLICATION.UPDATE]),
    controller.update
);

router.delete('/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.PUBLICATION.DELETE]),
    controller.delete
);

export default router;
