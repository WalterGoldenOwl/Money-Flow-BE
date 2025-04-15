import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import config from '../config';
import { responseFailure } from '../utils/Response';
import { log } from 'console';

export default function authenticationMiddleware(expectedType: 'access' | 'forgot-password' | 'change-password' | 'sign-up') {
    return (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers['authorization'];
        const deviceID = req.headers['device-id'];

        req.deviceID = deviceID;

        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            responseFailure(res, 401, 'Invalid token type!');
            return;
        }

        try {
            const payload = jwt.verify(token, config.ACCESS_TOKEN_PRIVATE_KEY) as {
                userId: number;
                type?: string;
            };

            if (!payload || payload.type !== expectedType) {
                responseFailure(res, 401, 'Invalid token type!');
                return;
            }

            req.userId = payload.userId;
            next();
        } catch (error) {
            log('error', error);
            responseFailure(res, 403, 'Token is not valid!');
        }
    };
}
