import { Router } from 'express';
import directorateController from '../controllers/directorateController';
const router: Router = Router();
import { verifyActiveAccount } from "../middleware/auth";

router.post('/', verifyActiveAccount, directorateController.createDirectorate);
router.get('/', verifyActiveAccount, directorateController.getAllDirectorates);
router.get('/:id', verifyActiveAccount, directorateController.getDirectorateById);
router.put('/:id', verifyActiveAccount, directorateController.updateDirectorate);
router.delete('/:id', verifyActiveAccount, directorateController.deleteDirectorate);

export default router;
