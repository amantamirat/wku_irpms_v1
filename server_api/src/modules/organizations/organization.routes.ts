import { Router } from 'express';
import organizationController from './organization.controller';
import { verifyActiveAccount } from '../../middleware/auth';
const router = Router();
// Create a new organization
router.post('/', verifyActiveAccount, organizationController.createOrganization);
// Get organizations by type (e.g., Program, Department, etc.)
router.get('/:type', verifyActiveAccount, organizationController.getOrganizationsByType);
// Update an organization by ID
router.put('/:id', verifyActiveAccount, organizationController.updateOrganization);
// Delete an organization by ID
router.delete('/:id', verifyActiveAccount, organizationController.deleteOrganization);
export default router;
