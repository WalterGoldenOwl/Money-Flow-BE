import express from 'express';
import AuthController from '../controllers/AuthController';
import authenticationMiddleware from '../middleware/authentication';

const AuthRouter = express.Router();

AuthRouter.get('/check-user', AuthController.checkUser);
AuthRouter.post('/login', AuthController.login);
AuthRouter.post('/sign-up/verify', authenticationMiddleware('sign-up'), AuthController.verifyAccount);
AuthRouter.post('/sign-up', AuthController.signUp);
AuthRouter.post('/resend-otp', AuthController.resendOTP);
AuthRouter.post('/forgot-password', authenticationMiddleware('forgot-password'), AuthController.forgotPassword);
AuthRouter.post('/change-password/confirm', authenticationMiddleware('change-password'), AuthController.confirmPassword);
AuthRouter.post('/change-password', authenticationMiddleware('access'), AuthController.changePassword);
AuthRouter.post('/user', authenticationMiddleware('access'), AuthController.updateUser);
AuthRouter.post('/locale', authenticationMiddleware('access'), AuthController.updateLocal);
AuthRouter.post('/refresh-token', AuthController.refreshToken);
AuthRouter.delete('/logout', authenticationMiddleware('access'), AuthController.logout);

export default AuthRouter;