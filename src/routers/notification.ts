import express from 'express';
import NotificationController from '../controllers/NotificationController';
import authenticationMiddleware from '../middleware/authentication';

const NotificationRouter = express.Router();

NotificationRouter.get('/unread', authenticationMiddleware, NotificationController.unreadNotification);
NotificationRouter.get('/', authenticationMiddleware, NotificationController.getNotification);
NotificationRouter.patch('/mark-as-read/:notification_id', authenticationMiddleware, NotificationController.markAsRead);
NotificationRouter.post('/', authenticationMiddleware, NotificationController.registerFCMToken);
NotificationRouter.delete('/', authenticationMiddleware, NotificationController.removeFCMToken);

export default NotificationRouter;