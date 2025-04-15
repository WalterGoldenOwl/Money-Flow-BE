import { Request, Response } from 'express';
import { responseSuccess, responseFailure, paginationData } from '../utils/Response';
import knex from '../db/index';
import TransactionDTO from '../dto/TransactionDTO';
import CategoryDTO from '../dto/CategoryDTO';
import TransactionReportDTO from '../dto/TransactionReportDTO';
import NotificationController from './NotificationController';
import Notification from '../models/Notification';

class TransactionController {
    async createTransaction(req: Request, res: Response) {
        try {
            const { category_id, amount, description, attachment, date_created } = req.body;
            const dateCreated = date_created ? new Date(date_created as string) : null;

            if (!category_id) {
                responseFailure(res, 400, 'Category is required');
                return;
            }

            if (!amount) {
                responseFailure(res, 400, 'Amount is required');
                return;
            }

            if (!dateCreated) {
                responseFailure(res, 400, 'Date is required');
                return;
            }

            const [transaction] = await knex('transactions')
                .insert({
                    user_id: req.userId,
                    category_id: category_id,
                    amount: amount,
                    description: description,
                    attachment: attachment,
                    date_created: dateCreated,
                })
                .returning('*');

            var response = await Promise.all([
                knex('categories').where('id', category_id).select('*').first(),
                NotificationController.addNotification(new Notification(req.userId, category_id, transaction.id, 'transaction'))
            ]);

            const category = response[0];

            const transactionDTO = new TransactionDTO(
                transaction.id,
                transaction.description,
                transaction.attachment,
                new CategoryDTO(
                    category.id,
                    category.name,
                    category.icon,
                    category.type
                ),
                transaction.amount,
                transaction.created_at,
                transaction.updated_at,
                transaction.date_created
            );

            responseSuccess(res, transactionDTO);
        } catch (error) {
            console.log(error);
            responseFailure(res, 500, error);
        }
    }

    async getTransaction(req: Request, res: Response) {
        try {
            const transactionID = req.params.transaction_id;
            if (!transactionID) {
                responseFailure(res, 400, 'Transaction ID is required');
                return;
            }

            const transaction = await knex('transactions as t')
                .select(
                    't.*',
                    'c.id as category_id',
                    'c.name as category_name',
                    'c.icon as category_icon',
                    'c.type as category_type'
                )
                .leftJoin('categories as c', 't.category_id', 'c.id')
                .where({ 't.id': transactionID, 't.user_id': req.userId })
                .first();

            if (!transaction) {
                responseFailure(res, 404, 'Transaction not found');
                return;
            }

            const transactionDTO = new TransactionDTO(
                Number(transactionID),
                transaction.description,
                transaction.attachment,
                new CategoryDTO(
                    transaction.category_id,
                    transaction.category_name,
                    transaction.category_icon,
                    transaction.category_type
                ),
                transaction.amount,
                transaction.created_at,
                transaction.updated_at,
                transaction.date_created
            );

            responseSuccess(res, transactionDTO);
        } catch (error) {
            console.log(error);
            responseFailure(res, 500, error);
        }
    }

    async updateTransaction(req: Request, res: Response) {
        try {
            const transactionID = req.params.transaction_id;
            if (!transactionID) {
                responseFailure(res, 400, 'Transaction ID is required');
                return;
            }

            const { category_id, amount, description, attachment, date_created } = req.body;
            const dateCreated = date_created ? new Date(date_created as string) : null;

            const updateData: Record<string, any> = {
                category_id: category_id,
                amount: amount,
                description: description,
                attachment: attachment,
                date_created: dateCreated,
            };

            Object.keys(updateData).forEach((key) => {
                if (updateData[key] === null || updateData[key] === undefined) {
                    delete updateData[key];
                }
            });

            var oldCategory = null

            if (category_id) {
                const transactionBeforeUpdate = await knex('transactions')
                    .where({ id: transactionID, user_id: req.userId })
                    .first();
                if (category_id != transactionBeforeUpdate.category_id) {
                    oldCategory = transactionBeforeUpdate.category_id
                }
            }

            const [updatedTransaction] = await knex('transactions')
                .where({ id: transactionID, user_id: req.userId })
                .update(updateData)
                .returning('*');

            if (!updatedTransaction) {
                responseFailure(res, 404, 'Transaction not found');
                return;
            }

            const [category] = await Promise.all([
                knex('categories').where('id', updatedTransaction.category_id).select('*').first(),
                NotificationController.addNotification(new Notification(req.userId, category_id, Number(transactionID), oldCategory ? 'move' : "update", oldCategory))
            ])

            const transactionDTO = new TransactionDTO(
                updatedTransaction.id,
                updatedTransaction.description,
                updatedTransaction.attachment,
                new CategoryDTO(
                    category.id,
                    category.name,
                    category.icon,
                    category.type
                ),
                updatedTransaction.amount,
                updatedTransaction.created_at,
                updatedTransaction.updated_at,
                updatedTransaction.date_created
            );

            responseSuccess(res, transactionDTO);
        } catch (error) {
            console.log(error);
            responseFailure(res, 500, error);
        }
    }

    async deleteTransaction(req: Request, res: Response) {
        try {
            const transactionID = req.params.transaction_id
            if (transactionID === null || transactionID === undefined) {
                responseFailure(res, 400, 'Transaction ID is required');
                return
            }

            const [result] = await Promise.all([
                knex('transactions').where({ 'id': transactionID, 'user_id': req.userId }).delete(),
                knex('notifications').where({ 'user_id': req.userId, 'transaction_id': transactionID }).delete(),
            ])

            responseSuccess(res, result);
        } catch (error) {
            console.log(error);
            responseFailure(res, 500, error);
        }
    }

    async getHistoryTransaction(req: Request, res: Response) {
        try {
            const { from, to, category_id, type, page = 1, page_size = 20 } = req.query;

            const offset = (Number(page) - 1) * Number(page_size);

            const baseQuery = knex('transactions as t')
                .leftJoin('categories as c', 't.category_id', 'c.id')
                .where('t.user_id', req.userId)
                .orderBy('t.date_created', 'desc')
                .select([
                    't.*',
                    'c.name as category_name',
                    'c.icon as category_icon',
                    'c.type as category_type'
                ]);

            if (category_id) {
                baseQuery.where('t.category_id', category_id);
            }

            if (type) {
                baseQuery.where('c.type', (type as string).toLowerCase());
            }

            if (from || to) {
                const fromDate = from ? new Date(from as string) : null;
                let toDate = to ? new Date(to as string) : null;

                if (toDate) {
                    toDate.setHours(23, 59, 59, 999);
                }

                if (fromDate && toDate) {
                    baseQuery.whereBetween('t.date_created', [fromDate, toDate]);
                } else {
                    if (fromDate) baseQuery.where('t.date_created', '>=', fromDate);
                    if (toDate) baseQuery.where('t.date_created', '<=', toDate);
                }
            }

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

            const transactionsDTO = data.map(transaction => new TransactionDTO(
                transaction.id,
                transaction.description,
                transaction.attachment,
                new CategoryDTO(
                    transaction.category_id,
                    transaction.category_name,
                    transaction.category_icon,
                    transaction.category_type
                ),
                transaction.amount,
                transaction.created_at,
                transaction.updated_at,
                transaction.date_created
            ));

            const total = Number(totalResult?.total) || 0;
            const totalPages = Math.ceil(total / Number(page_size));

            paginationData(res, transactionsDTO, {
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

    async exportTransaction(req: Request, res: Response) {
        try {
            const { from, to } = req.query;

            if (!from || !to ||
                isNaN(new Date(from as string).getTime()) ||
                isNaN(new Date(to as string).getTime())) {
                responseFailure(res, 400, "Invalid date parameters. Both 'from' and 'to' dates are required");
                return;
            }

            const baseQuery = knex('transactions as t')
                .leftJoin('categories as c', 't.category_id', 'c.id')
                .where('t.user_id', req.userId)
                .orderBy('t.date_created', 'desc')
                .select([
                    't.*',
                    'c.name as category_name',
                    'c.icon as category_icon',
                    'c.type as category_type'
                ]);

            const fromDate = from ? new Date(from as string) : null;
            let toDate = to ? new Date(to as string) : null;

            if (toDate) {
                toDate.setHours(23, 59, 59, 999);
            }

            if (fromDate && toDate) {
                baseQuery.whereBetween('t.date_created', [fromDate, toDate]);
            } else {
                if (fromDate) baseQuery.where('t.date_created', '>=', fromDate);
                if (toDate) baseQuery.where('t.date_created', '<=', toDate);
            }

            const data = await baseQuery.clone()

            const transactionsDTO = data.map(transaction => new TransactionDTO(
                transaction.id,
                transaction.description,
                transaction.attachment,
                new CategoryDTO(
                    transaction.category_id,
                    transaction.category_name,
                    transaction.category_icon,
                    transaction.category_type
                ),
                transaction.amount,
                transaction.created_at,
                transaction.updated_at,
                transaction.date_created
            ));


            responseSuccess(res, transactionsDTO);
        } catch (error) {
            console.log(error);
            responseFailure(res, 500, error);
        }
    }

    async transactionReport(req: Request, res: Response) {
        try {
            const { from, to } = req.query;
            const userId = req.userId;

            if (!from || !to ||
                isNaN(new Date(from as string).getTime()) ||
                isNaN(new Date(to as string).getTime())) {
                responseFailure(res, 400, "Invalid date parameters. Both 'from' and 'to' dates are required");
                return;
            }

            const startDate = new Date(from as string);
            const endDate = new Date(to as string);

            if (startDate > endDate) {
                responseFailure(res, 400, "'from' date must be before 'to' date");
                return;
            }

            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);

            const totals = await knex('transactions as t')
                .join('categories as c', 't.category_id', 'c.id')
                .where('t.user_id', userId)
                .whereBetween('t.created_at', [startDate, endDate])
                .select(
                    knex.raw('COALESCE(SUM(CASE WHEN c.type = ? THEN t.amount ELSE 0 END), 0) as income', ['income']),
                    knex.raw('COALESCE(SUM(CASE WHEN c.type = ? THEN t.amount ELSE 0 END), 0) as expense', ['expense'])
                )
                .first();

            const monthlyReport = new TransactionReportDTO(
                Number(totals.income),
                Number(totals.expense)
            );

            responseSuccess(res, monthlyReport);
        } catch (error) {
            console.log('Error calculating totals:', error);
            responseFailure(res, 500, error);
        }
    }
}

export default new TransactionController();