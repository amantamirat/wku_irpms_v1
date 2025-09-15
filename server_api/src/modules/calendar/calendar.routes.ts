import { Router } from 'express';
import {CalendarController} from './calendar.controller';
import { verifyActiveAccount } from '../users/auth/auth.middleware';

const router: Router = Router();

router.post('/', verifyActiveAccount, CalendarController.createCalendar);
router.get('/', verifyActiveAccount, CalendarController.getCalendars);
router.put('/:id', verifyActiveAccount, CalendarController.updateCalendar);
router.delete('/:id', verifyActiveAccount, CalendarController.deleteCalendar);

export default router;
