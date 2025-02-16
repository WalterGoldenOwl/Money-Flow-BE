import express from 'express';
import TransactionController from '../controllers/TransactionController';
import authenticationMiddleware from '../middleware/authentication';

const TransactionRouter = express.Router();

TransactionRouter.get('/', authenticationMiddleware, TransactionController.getHistoryTransaction);
TransactionRouter.post('/', authenticationMiddleware, TransactionController.createTransaction);
TransactionRouter.get('/:transaction_id', authenticationMiddleware, TransactionController.getTransaction);
TransactionRouter.patch('/:transaction_id', authenticationMiddleware, TransactionController.updateTransaction);
TransactionRouter.delete('/:transaction_id', authenticationMiddleware, TransactionController.deleteTransaction);

export default TransactionRouter;