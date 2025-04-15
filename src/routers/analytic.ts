import express from 'express';
import AnalyticController from '../controllers/AnalyticController';
import authenticationMiddleware from '../middleware/authentication';

const AnalyticRouter = express.Router();

AnalyticRouter.get('/weekly', authenticationMiddleware('access'), AnalyticController.weekly);
AnalyticRouter.get('/monthly', authenticationMiddleware('access'), AnalyticController.monthly);
AnalyticRouter.get('/yearly', authenticationMiddleware('access'), AnalyticController.yearly);


export default AnalyticRouter;