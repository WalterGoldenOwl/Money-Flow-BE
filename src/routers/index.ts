import express from 'express';
import AuthRouter from './auth';
import TransactionRouter from './transaction';

const router = express.Router();

router.use('/auth', AuthRouter);
router.use('/transaction', TransactionRouter);

router.get('/', (_, res) => {
    res.send('Hello from Money Flow Server!');
})

router.get('/*', (_, res) => {
    res.status(404).send('404 Not Found');
});

export default router;