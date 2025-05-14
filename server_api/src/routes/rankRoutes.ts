import { Router } from 'express';
import rankController from '../controllers/rankController';
const router: Router = Router();
import { verifyActiveAccount } from "../middleware/auth";

router.post('/', verifyActiveAccount, rankController.createRank);
router.get('/', rankController.getAllRanks);
router.get('/:category', rankController.getRankByCategory);
router.put('/:id', verifyActiveAccount, rankController.updateRank);
router.delete('/:id', verifyActiveAccount, rankController.deleteRank);

export default router;
