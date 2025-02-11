import jwt from 'jsonwebtoken';
import config from '../config';

export function generateAccessToken(userId: number): string {
    return jwt.sign({ userId: userId }, config.ACCESS_TOKEN_PRIVATE_KEY, { expiresIn: '7d' });
}

export function generateRefreshToken(userId: number): string {
    return jwt.sign({ userId: userId }, config.REFRESH_TOKEN_PRIVATE_KEY, { expiresIn: '30d' });
}