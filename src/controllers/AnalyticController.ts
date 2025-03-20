import e, { Request, Response } from 'express';
import { responseSuccess, responseFailure } from '../utils/Response';
import { getWeekRangesInMonth } from '../utils/getWeekRangesInMonth';
import knex from '../db/index';

interface TransactionStats {
    column: number[];
    pie: Record<number, number>;
}

class AnalyticController {
    async weekly(req: Request, res: Response) {
        try {
            const { start_date, type } = req.query;

            if (!start_date || !type) {
                res.status(400).json({ error: 'Missing required parameters' });
                return;
            }

            const startDate = new Date(start_date as string);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 7);
            endDate.setUTCHours(23, 59, 59, 999);

            const baseQuery = knex('transactions')
                .where('transactions.user_id', req.userId)
                .join('categories', 'transactions.category_id', 'categories.id')
                .where('categories.type', (type as string).toLowerCase())
                .whereBetween('transactions.created_at', [startDate, endDate]);

            const dailyTotalsPromise = baseQuery
                .clone()
                .select(knex.raw('EXTRACT(DOW FROM transactions.created_at) as day'))
                .sum('amount as total')
                .groupBy(knex.raw('EXTRACT(DOW FROM transactions.created_at)'))
                .orderBy('day');

            const categoryTotalsPromise = baseQuery
                .clone()
                .select('category_id')
                .sum('amount as total')
                .groupBy('category_id');

            const [dailyTotals, categoryTotals] = await Promise.all([
                dailyTotalsPromise,
                categoryTotalsPromise
            ]);

            const columnData = new Array(7).fill(0);
            dailyTotals.forEach((record: any) => {
                columnData[Math.floor(record.day)] = Number(record.total);
            });

            const pieData: Record<number, number> = {};
            categoryTotals.forEach((record: any) => {
                pieData[record.category_id] = Number(record.total);
            });

            const result: TransactionStats = {
                column: columnData,
                pie: pieData
            };
            responseSuccess(res, result);
        } catch (error) {
            console.error('Error getting transaction stats:', error);
            responseFailure(res, 500, 'Internal server error');
        }
    }

    async monthly(req: Request, res: Response) {
        try {
            const { start_date, type } = req.query;

            if (!start_date || !type) {
                res.status(400).json({ error: 'Missing required parameters' });
                return;
            }

            const startDate = new Date(start_date as string);
            if (isNaN(startDate.getTime())) {
                res.status(400).json({ error: 'Invalid date format' });
                return;
            }

            const weekRanges = getWeekRangesInMonth(startDate);

            console.log(weekRanges);

            const baseQuery = knex('transactions')
                .where('transactions.user_id', req.userId)
                .join('categories', 'transactions.category_id', 'categories.id')
                .where('categories.type', (type as string).toLowerCase());

            const weeklyTotalsPromise = Promise.all(
                weekRanges.map((range, index) =>
                    baseQuery
                        .clone()
                        .whereBetween('transactions.created_at', [range.start, range.end])
                        .sum('amount as total')
                        .first()
                        .then(result => ({
                            week: index + 1,
                            total: Number(result?.total || 0)
                        }))
                )
            );

            const categoryTotalsPromise = baseQuery
                .clone()
                .whereBetween('transactions.created_at', [
                    weekRanges[0].start,
                    weekRanges[weekRanges.length - 1].end
                ])
                .select('category_id')
                .sum('amount as total')
                .groupBy('category_id');

            const [weeklyTotals, categoryTotals] = await Promise.all([
                weeklyTotalsPromise,
                categoryTotalsPromise
            ]);

            const columnData = weeklyTotals.map(week => week.total);

            const pieData: Record<number, number> = {};
            categoryTotals.forEach((record: any) => {
                pieData[record.category_id] = Number(record.total);
            });

            const result: TransactionStats = {
                column: columnData,
                pie: pieData
            };

            responseSuccess(res, result);
        } catch (error) {
            console.error('Error getting monthly transaction stats:', error);
            responseFailure(res, 500, 'Internal server error');
        }
    }

    async yearly(req: Request, res: Response) {
        try {
            const { year, type } = req.query;

            if (!year || !type) {
                res.status(400).json({ error: 'Missing required parameters' });
                return;
            }

            const startDate = new Date(Date.UTC(Number(year), 0, 1));
            const endDate = new Date(Date.UTC(Number(year), 11, 31, 23, 59, 59, 999));

            const baseQuery = knex('transactions')
                .where('transactions.user_id', req.userId)
                .join('categories', 'transactions.category_id', 'categories.id')
                .where('categories.type', (type as string).toLowerCase())
                .whereBetween('transactions.created_at', [startDate, endDate]);

            const monthlyTotalsPromise = baseQuery
                .clone()
                .select(knex.raw('EXTRACT(MONTH FROM transactions.created_at) as month'))
                .sum('amount as total')
                .groupBy(knex.raw('EXTRACT(MONTH FROM transactions.created_at)'))
                .orderBy('month');

            const categoryTotalsPromise = baseQuery
                .clone()
                .select('category_id')
                .sum('amount as total')
                .groupBy('category_id');

            const [monthlyTotals, categoryTotals] = await Promise.all([
                monthlyTotalsPromise,
                categoryTotalsPromise
            ]);

            const columnData = new Array(12).fill(0);
            monthlyTotals.forEach((record: any) => {
                columnData[Math.floor(record.month) - 1] = Number(record.total);
            });

            const pieData: Record<number, number> = {};
            categoryTotals.forEach((record: any) => {
                pieData[record.category_id] = Number(record.total);
            });

            const result: TransactionStats = {
                column: columnData,
                pie: pieData
            };

            responseSuccess(res, result);
        } catch (error) {
            console.error('Error getting transaction stats:', error);
            responseFailure(res, 500, 'Internal server error');
        }
    }
}

export default new AnalyticController();