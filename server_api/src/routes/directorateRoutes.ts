import { Router } from 'express';
import directorateController from '../controllers/directorateController';
const router: Router = Router();
import { authenticateToken } from "../middleware/auth";

router.post('/', authenticateToken, directorateController.createDirectorate);
router.get('/', authenticateToken, directorateController.getAllDirectorates);
router.get('/:id', authenticateToken, directorateController.getDirectorateById);
router.put('/:id', authenticateToken, directorateController.updateDirectorate);
router.delete('/:id', authenticateToken, directorateController.deleteDirectorate);

export default router;
