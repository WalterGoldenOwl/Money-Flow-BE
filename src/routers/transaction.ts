import express from 'express';
import TransactionController from '../controllers/TransactionController';
import authenticationMiddleware from '../middleware/authentication';

const TransactionRouter = express.Router();

TransactionRouter.get('/report', authenticationMiddleware('access'), TransactionController.transactionReport);

TransactionRouter.get('/', authenticationMiddleware('access'), TransactionController.getHistoryTransaction);
TransactionRouter.post('/', authenticationMiddleware('access'), TransactionController.createTransaction);
TransactionRouter.get('/export', authenticationMiddleware('access'), TransactionController.exportTransaction);
TransactionRouter.get('/:transaction_id', authenticationMiddleware('access'), TransactionController.getTransaction);
TransactionRouter.patch('/:transaction_id', authenticationMiddleware('access'), TransactionController.updateTransaction);
TransactionRouter.delete('/:transaction_id', authenticationMiddleware('access'), TransactionController.deleteTransaction);

export default TransactionRouter;