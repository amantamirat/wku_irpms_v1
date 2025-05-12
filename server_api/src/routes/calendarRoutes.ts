import { Router } from 'express';
import calendarController from '../controllers/calendarController';
import { verifyActiveAccount } from '../middleware/auth';

const router: Router = Router();

router.post('/', verifyActiveAccount, calendarController.createCalendar);
router.get('/', verifyActiveAccount, calendarController.getAllCalendars);
router.put('/:id', verifyActiveAccount, calendarController.updateCalendar);
router.delete('/:id', verifyActiveAccount, calendarController.deleteCalendar);

export default router;
