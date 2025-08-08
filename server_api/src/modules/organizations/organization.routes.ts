import { Router } from 'express';
import organizationController from './organization.controller';
import { verifyActiveAccount } from '../../middleware/auth';
const router = Router();

router.post('/', verifyActiveAccount, organizationController.createOrganization);
router.get('/:id', verifyActiveAccount, organizationController.getDirectorateById);
router.get('/type/:type', verifyActiveAccount, organizationController.getOrganizationsByType);
router.get('/parent/:parent', verifyActiveAccount, organizationController.getOrganizationsByParent);
router.put('/:id', verifyActiveAccount, organizationController.updateOrganization);
router.delete('/:id', verifyActiveAccount, organizationController.deleteOrganization);
export default router;
