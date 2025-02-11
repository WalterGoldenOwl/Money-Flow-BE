import express from 'express';
import AuthController from '../controllers/AuthController';
import authenticationMiddleware from '../middleware/authentication';

const AuthRouter = express.Router();

AuthRouter.post('/login', AuthController.login);
AuthRouter.post('/sign-up', AuthController.signUp);
AuthRouter.post('/refresh-token', AuthController.refreshToken);
AuthRouter.delete('/logout', authenticationMiddleware, AuthController.logout);

export default AuthRouter;