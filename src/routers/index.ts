import express from 'express';
import AuthRouter from './auth';

const router = express.Router();

router.use('/auth', AuthRouter);

router.get('/', (_, res) => {
    res.send('Hello from Money Flow Server!');
})

router.get('/*', (_, res) => {
    res.status(404).send('404 Not Found');
});

export default router;