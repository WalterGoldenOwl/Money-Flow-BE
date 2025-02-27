import { Request, Response } from 'express';
import knex from '../db/index';
import { paginationData, responseFailure, responseSuccess } from "../utils/Response";
import * as admin from 'firebase-admin';
import Notification from '../models/Notification';
import NotificationDTO from '../dto/NotificationDTO';
import CategoryDTO from '../dto/CategoryDTO';

class NotificationController {
    async registerFCMToken(req: Request, res: Response) {
        try {
            if (!req.deviceID) {
                responseFailure(res, 400, 'Device ID is required');
                return
            }

            const { token } = req.body;
            if (!token) {
                responseFailure(res, 400, 'Token is required');
                return
            }

            await knex('fcm_tokens').insert({
                user_id: req.userId,
                token: token,
                device_id: req.deviceID,
            })
            responseSuccess(res, 'Token registered successfully')
        } catch (error) {
            console.log(error);
            responseFailure(res, 500, error);
        }
    }

    async removeFCMToken(req: Request, res: Response) {
        try {
            if (!req.deviceID) {
                responseFailure(res, 400, 'Device ID is required');
                return
            }

            const result = await knex('fcm_tokens')
                .where({ 'device_id': req.deviceID, 'user_id': req.userId })
                .delete()
            responseSuccess(res, result)
        } catch (error) {
            console.log(error);
            responseFailure(res, 500, error);
        }
    }

    async unreadNotification(req: Request, res: Response) {
        try {
            const result = await knex('notifications')
                .where({ 'user_id': req.userId, 'is_read': false })
                .count('* as total')
                .first()
            responseSuccess(res, Number(result?.total))
        } catch (error) {
            console.log(error);
            responseFailure(res, 500, error);
        }
    }

    async markAsRead(req: Request, res: Response) {
        try {
            const notification_id = req.params.notification_id;

            const notificationId = Number(notification_id);

            if (!notificationId) {
                responseFailure(res, 400, 'Notification ID is required');
                return
            }

            const result = await knex('notifications')
                .where({ 'user_id': req.userId, 'is_read': false, 'id': notificationId })
                .update({ 'is_read': true })
            responseSuccess(res, result)
        } catch (error) {
            console.log(error);
            responseFailure(res, 500, error);
        }
    }

    async getNotification(req: Request, res: Response) {
        try {
            const { page = 1, page_size = 20 } = req.query

            const offset = (Number(page) - 1) * Number(page_size);

            const baseQuery = knex('notifications as n')
                .leftJoin('categories as c', 'n.category_id', 'c.id')
                .where({ 'user_id': req.userId })
                .orderBy('created_at', 'desc')
                .select([
                    'n.*',
                    'c.name as category_name',
                    'c.icon as category_icon',
                    'c.type as category_type'
                ])

            const [data, totalResult] = await Promise.all([
                baseQuery.clone()
                    .offset(offset)
                    .limit(Number(page_size)),

                baseQuery.clone()
                    .clearOrder()
                    .clearSelect()
                    .count('* as total')
                    .first()
            ]);

            const notifications = data.map(notification => new NotificationDTO(
                notification.id,
                notification.type,
                new CategoryDTO(
                    notification.category_id,
                    notification.category_name,
                    notification.category_icon,
                    notification.category_type
                ),
                notification.transaction_id,
                notification.is_read,
                notification.created_at,
                notification.updated_at
            ))

            const total = Number(totalResult?.total) || 0;
            const totalPages = Math.ceil(total / Number(page_size));

            paginationData(res, notifications, {
                total: total,
                page_size: Number(page_size),
                current_page: Number(page),
                total_pages: totalPages,
                is_previous: Number(page) > 1,
                is_next: Number(page) < totalPages,
            });
        } catch (error) {
            console.log(error);
            responseFailure(res, 500, error);
        }
    }

    async pushNotification(userId: number, title: string, body: string) {
        try {
            const tokens = await knex('fcm_tokens')
                .where({ 'user_id': userId })
                .select('token')
            const message = {
                notification: {
                    title: title,
                    body: body
                },
                tokens: tokens.map(token => token.token)
            }
            await admin.messaging().sendEachForMulticast(message)
                .then((response) => {
                    console.log('Successfully sent message:', response);
                })
                .catch((error) => {
                    console.log('Error sending message:', error);
                })
        } catch (error) {
            console.log(`send notification error: ${error}`);
        }
    }

    async addNotification(notification: Notification) {
        try {
            var response = await Promise.all([
                knex('notifications').insert(notification),
                knex('categories').where({ 'id': notification.category_id }).first()
            ])

            const category = response[1]

            if (!category) return
            var body = ''
            switch (category.type) {
                case "expense":
                    body = `You just paid your ${(category.name as string).toLowerCase()} bill`
                    break;

                case "income":
                    body = `You just received your ${(category.name as string).toLowerCase()} income`

                default:
                    break;
            }
            this.pushNotification(notification.user_id, category.name, body)
        } catch (error) {
            console.log(error);
        }
    }
}

export default new NotificationController();