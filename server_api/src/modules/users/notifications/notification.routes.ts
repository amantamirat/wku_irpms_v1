import { Router } from 'express';
import { verifyActiveAccount } from '../../users/auth/auth.middleware';
import { NotificationController } from './notification.controller';
import { NotificationRepository } from './notification.repository';
import { NotificationService } from './notification.service';
import { SettingService } from '../../settings/setting.service';
import { SettingRepository } from '../../settings/setting.repository';

const repository = new NotificationRepository();
const settingService = new SettingService(new SettingRepository());
const service = new NotificationService(repository, settingService);
const controller = new NotificationController(service);
const router: Router = Router();

// Get the user's notification inbox
router.get('/',
    verifyActiveAccount,
    // checkPermission([PERMISSIONS.NOTIFICATION.READ]), 
    controller.getInbox
);

// Mark a specific notification as read
router.patch('/:id/read',
    verifyActiveAccount,
    // checkPermission([PERMISSIONS.NOTIFICATION.UPDATE]), 
    controller.markAsRead
);

// Bulk mark all as read
router.post('/read-all',
    verifyActiveAccount,
    // checkPermission([PERMISSIONS.NOTIFICATION.UPDATE]), 
    controller.markAllRead
);

export default router;