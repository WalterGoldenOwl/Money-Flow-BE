import { Request, Response } from 'express';
import knex from '../db/index';
import hashPassword from '../middleware/hashPassword';
import bcrypt from 'bcrypt';
import { responseSuccess, responseFailure } from '../utils/Response';
import { generateAccessToken, generateRefreshToken } from '../middleware/generateToken';
import UserDTO from '../dto/UserDTO';
import config from '../config';
import jwt from 'jsonwebtoken';

class AuthController {
    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            if (!email) {
                responseFailure(res, 400, 'Email is required');
                return
            }
            if (!password) {
                responseFailure(res, 400, 'Password is required');
                return
            }
            const result = await knex('users').where({ email: email }).first();
            if (!result) {
                responseFailure(res, 400, 'Invalid email or password');
                return
            }
            const isMatch = await bcrypt.compare(password, result.password);
            if (isMatch) {
                const accessToken = generateAccessToken(result.id);
                const refreshToken = generateRefreshToken(result.id);

                const userDTO = new UserDTO(result.id, result.fullname, result.email);
                await knex('tokens').insert({
                    user_id: result.id,
                    refresh_token: refreshToken,
                    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
                })
                responseSuccess(res, {
                    user: userDTO,
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });
            } else {
                responseFailure(res, 400, 'Invalid email or password');
            }
        } catch (error) {
            console.log(error);
            responseFailure(res, 500, error);
        }
    }

    async signUp(req: Request, res: Response) {
        try {
            const { fullname, email, password } = req.body;

            if (!fullname) {
                responseFailure(res, 400, 'Fullname is required');
                return
            }

            if (!email) {
                responseFailure(res, 400, 'Email is required');
                return
            }

            if (!password) {
                responseFailure(res, 400, 'Password is required');
                return
            }

            const result = await knex('users').insert({
                fullname: fullname,
                email: email,
                password: await hashPassword(password),
            }).returning('*');
            const user = result[0];
            const userDTO = new UserDTO(user.id, user.fullname, user.email);
            responseSuccess(res, userDTO);
        } catch (error) {
            console.log(error);
            responseFailure(res, 500, error);
        }
    }

    async refreshToken(req: Request, res: Response) {
        try {
            const { refresh_token } = req.body;
            if (!refresh_token) {
                responseFailure(res, 400, 'Refresh token is required');
                return
            }

            const payload = jwt.verify(refresh_token, config.REFRESH_TOKEN_PRIVATE_KEY)
            if (!payload) {
                responseFailure(res, 403, 'Refresh token is not valid');
                return
            }

            const token = await knex('tokens').where({ refresh_token: refresh_token }).first();
            if (!token) {
                responseFailure(res, 403, 'Refresh token is not valid');
                return
            }

            const user = await knex('users').where({ id: token.user_id }).first();
            if (!user) {
                responseFailure(res, 403, 'User is not exist');
                return
            }
            const accessToken = generateAccessToken(token.user_id);
            const newRefreshToken = generateRefreshToken(token.user_id);
            await knex('tokens').where({ refresh_token: refresh_token }).update({
                refresh_token: newRefreshToken,
                expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
            });
            responseSuccess(res, {
                access_token: accessToken,
                refresh_token: newRefreshToken,
            });
        } catch (error) {
            console.log(error);
            responseFailure(res, 500, error);
        }
    }

    async logout(req: Request, res: Response) {
        try {
            const userId = req.userId;
            await knex('tokens').where({ user_id: userId }).del();
            responseSuccess(res, 'Logout successfully');
        } catch (error) {
            console.log(error);
            responseFailure(res, 500, error);
        }
    }
}

export default new AuthController();