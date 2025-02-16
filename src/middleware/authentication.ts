import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import config from '../config';
import { responseFailure } from '../utils/Response';
import { log } from 'console';

export default function authenticationMiddleware(req: Request, res: Response, next: NextFunction) {

    const authHeader = req.headers['authorization']

    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
        res.sendStatus(401)
        return
    }
    try {
        const payload = jwt.verify(token, config.ACCESS_TOKEN_PRIVATE_KEY) as { userId: number }
        if (!payload) {
            responseFailure(res, 403, 'Token is not valid!')
            return
        }
        req.userId = payload.userId
        next()
    } catch (error) {
        log('error', error);
        responseFailure(res, 403, 'Token is not valid!')
    }
}
