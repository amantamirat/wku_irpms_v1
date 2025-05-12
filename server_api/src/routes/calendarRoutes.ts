import { Router } from 'express';
import academicCalendarController from '../controllers/academicController';
import { verifyActiveAccount } from '../middleware/auth';

const router: Router = Router();

router.post('/', verifyActiveAccount, academicCalendarController.createAcademicCalendar);
router.get('/', verifyActiveAccount, academicCalendarController.getAllAcademicCalendars);
router.put('/:id', verifyActiveAccount, academicCalendarController.updateAcademicCalendar);
router.delete('/:id', verifyActiveAccount, academicCalendarController.deleteAcademicCalendar);

export default router;
