import { Router } from 'express';
import { ProjectController } from './project.controller';
import { verifyActiveAccount } from '../users/auth/auth.middleware';
import { upload } from '../../config/multer';

const router: Router = Router();

router.post('/', verifyActiveAccount, ProjectController.createProject);
router.post("/submit", upload.single("document"), ProjectController.submitProject);
router.get('/', verifyActiveAccount, ProjectController.getProjects);
router.put('/:id', verifyActiveAccount, ProjectController.updateProject);
router.delete('/:id', verifyActiveAccount, ProjectController.deleteProject);

export default router;
