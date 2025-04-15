import express from 'express';
import NotificationController from '../controllers/NotificationController';
import authenticationMiddleware from '../middleware/authentication';

const NotificationRouter = express.Router();

NotificationRouter.get('/unread', authenticationMiddleware('access'), NotificationController.unreadNotification);
NotificationRouter.get('/', authenticationMiddleware('access'), NotificationController.getNotification);
NotificationRouter.patch('/mark-as-read/:notification_id', authenticationMiddleware('access'), NotificationController.markAsRead);
NotificationRouter.post('/', authenticationMiddleware('access'), NotificationController.registerFCMToken);
NotificationRouter.delete('/', authenticationMiddleware('access'), NotificationController.removeFCMToken);

export default NotificationRouter;