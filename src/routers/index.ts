import express from 'express';
import AuthRouter from './auth';
import TransactionRouter from './transaction';
import CategoryRouter from './category';
import AnalyticRouter from './analytic';
import NotificationRouter from './notification';

const router = express.Router();

router.use('/auth', AuthRouter);
router.use('/transaction', TransactionRouter);
router.use('/category', CategoryRouter);
router.use('/analytic', AnalyticRouter);
router.use('/notification', NotificationRouter);

router.get('/', (_, res) => {
    res.send('Hello from Money Flow Server!');
})

router.get('/*', (_, res) => {
    res.status(404).send('404 Not Found');
});

export default router;