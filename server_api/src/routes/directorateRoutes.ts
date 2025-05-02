import { Router } from 'express';
import directorateController from '../controllers/directorateController'; 
const router: Router = Router();

router.post('/', directorateController.createDirectorate);
router.get('/', directorateController.getAllDirectorates);
router.get('/:id', directorateController.getDirectorateById);
router.put('/:id', directorateController.updateDirectorate);
router.delete('/:id', directorateController.deleteDirectorate);

export default router;
