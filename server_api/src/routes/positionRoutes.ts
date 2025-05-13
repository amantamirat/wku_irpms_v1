import { Router } from 'express';
import positionController from '../controllers/positionController';
const router: Router = Router();
import { verifyActiveAccount } from "../middleware/auth";

router.post('/', verifyActiveAccount, positionController.createPosition);
router.get('/', verifyActiveAccount, positionController.getAllPositions);
router.put('/:id', verifyActiveAccount, positionController.updatePosition);
router.delete('/:id', verifyActiveAccount, positionController.deletePosition);

export default router;
