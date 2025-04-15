import jwt from 'jsonwebtoken';
import config from '../config';

export function generateAccessToken(userId: number): string {
    return jwt.sign({ userId: userId, type: "access" }, config.ACCESS_TOKEN_PRIVATE_KEY, { expiresIn: '7d' });
}

export function generateTemptAccessToken(userId: number, type: String): string {
    return jwt.sign({ userId: userId, type: type }, config.ACCESS_TOKEN_PRIVATE_KEY, { expiresIn: '2m' });
}

export function generateRefreshToken(userId: number): string {
    return jwt.sign({ userId: userId }, config.REFRESH_TOKEN_PRIVATE_KEY, { expiresIn: '30d' });
}