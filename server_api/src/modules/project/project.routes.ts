import { Router } from 'express';
import {ProjectController} from './project.controller';
import { verifyActiveAccount } from '../../middleware/auth';

const router: Router = Router();

router.post('/', verifyActiveAccount, ProjectController.createProject);
router.get('/', verifyActiveAccount, ProjectController.getProjects);
router.put('/:id', verifyActiveAccount, ProjectController.updateProject);
router.delete('/:id', verifyActiveAccount, ProjectController.deleteProject);

export default router;
