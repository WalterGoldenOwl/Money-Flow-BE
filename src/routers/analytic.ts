import express from 'express';
import AnalyticController from '../controllers/AnalyticController';
import authenticationMiddleware from '../middleware/authentication';

const AnalyticRouter = express.Router();

AnalyticRouter.get('/weekly', authenticationMiddleware, AnalyticController.weekly);
AnalyticRouter.get('/monthly', authenticationMiddleware, AnalyticController.monthly);
AnalyticRouter.get('/yearly', authenticationMiddleware, AnalyticController.yearly);


export default AnalyticRouter;