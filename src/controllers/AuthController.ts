import { Request, Response } from 'express';
import knex from '../db/index';
import hashPassword from '../middleware/hashPassword';
import bcrypt from 'bcrypt';
import { responseSuccess, responseFailure } from '../utils/Response';
import { generateAccessToken, generateRefreshToken, generateTemptAccessToken } from '../middleware/generateToken';
import UserDTO from '../dto/UserDTO';
import config from '../config';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';

const transporter = nodemailer.createTransport({
    service: config.EMAIL_SERVICE,
    auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASS,
    },
});

const client = new OAuth2Client(config.GOOGLE_CLIENT_ID);

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
            const result = await knex('users').whereRaw('LOWER(email) = LOWER(?)', [email]).first();
            if (!result) {
                responseFailure(res, 400, 'Invalid email or password');
                return
            }
            if (!result.is_verify) {
                responseFailure(res, 412, 'Account not verify');
                return
            }

            const isMatch = await bcrypt.compare(password, result.password);
            if (isMatch) {
                const accessToken = generateAccessToken(result.id);
                const refreshToken = generateRefreshToken(result.id);

                const userDTO = new UserDTO(result.id, result.fullname, result.email, result.avatar, result.currency, result.country, result.language, result.is_need_password);
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

    async loginWithGoogle(req: Request, res: Response) {
        const { token, country, language } = req.body;
        try {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: config.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();

            if (!payload) {
                responseFailure(res, 401, 'Invalid token');
                return
            }

            const { sub: googleId, email, name, picture } = payload;

            const user = await knex('users').whereRaw('LOWER(email) = LOWER(?)', [email]).first();
            var newUser: any = null;

            if (!user) {
                newUser = await knex('users').insert({
                    fullname: name,
                    email: email,
                    avatar: picture,
                    google_id: googleId,
                    is_verify: true,
                    sign_up_type: 'google',
                    country: country,
                    language: language,
                    is_need_password: true,
                    verified_at: new Date()
                }).returning('*');
            } else {
                const updateData: Record<string, any> = {};

                if (user.google_id === null) updateData.google_id = googleId;

                if (user.is_verify === false) {
                    updateData.is_verify = true;
                    updateData.verified_at = new Date();
                }

                if (Object.keys(updateData).length > 0) {
                    newUser = await knex('users')
                        .where({ id: user.id })
                        .update(updateData)
                        .returning('*');
                } else {
                    newUser = [user];
                }
            }

            const userDTO = new UserDTO(newUser[0].id, newUser[0].fullname, newUser[0].email, newUser[0].avatar, newUser[0].currency, newUser[0].country, newUser[0].language, newUser[0].is_need_password);
            const accessToken = generateAccessToken(newUser[0].id);
            const refreshToken = generateRefreshToken(newUser[0].id);

            await knex('tokens').insert({
                user_id: newUser[0].id,
                refresh_token: refreshToken,
                expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
            })
            responseSuccess(res, {
                user: userDTO,
                access_token: accessToken,
                refresh_token: refreshToken,
            });
        } catch (error) {
            console.error('Error verifying token:', error);
            responseFailure(res, 401, 'Invalid token');
        }
    }

    async signUp(req: Request, res: Response) {
        try {
            const { fullname, email, password, country, language } = req.body;

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
                country: country,
                language: language,
            }).returning('*');
            const user = result[0];
            const userDTO = new UserDTO(user.id, user.fullname, user.email, user.avatar, user.currency, user.country, user.language, user.is_need_password);

            const otp = Math.floor(100000 + Math.random() * 900000);
            const otpExpier = new Date();
            otpExpier.setMinutes(otpExpier.getMinutes() + 2);

            await knex("otps").insert({
                email: user.email,
                user_id: user.id,
                otp: otp,
                type: 'sign-up',
                expired_at: otpExpier,
            });

            const accessToken = generateTemptAccessToken(user.id, "sign-up");

            const mailOptions = {
                from: config.EMAIL_USER,
                to: user.email,
                subject: 'Verify Account OTP',
                text: `Your OTP (It will expire after 2 minutes): ${otp}`,
            };

            await new Promise((resolve, reject) => {
                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) return reject(err);
                    resolve(info);
                });
            });

            responseSuccess(res, { access_token: accessToken, user: userDTO });
        } catch (error) {
            console.log(error);
            responseFailure(res, 500, error);
        }
    }

    async verifyAccount(req: Request, res: Response) {
        try {
            const { otp } = req.body;

            if (!otp) {
                responseFailure(res, 400, 'OTP is required');
                return
            }

            const resultUser = await knex('users').where({ id: req.userId }).first();

            const result = await knex('otps').where({ otp: otp, user_id: resultUser.id, type: "sign-up" }).andWhereRaw('LOWER(email) = LOWER(?)', [resultUser.email]).first();

            if (!result) {
                responseFailure(res, 400, 'OTP invalid');
                return
            }

            const now = new Date();
            const expiredAt = new Date(result.expired_at);

            if (expiredAt < now) {
                responseFailure(res, 400, 'Expried OTP');
                return
            }

            const updatedUser = await knex.transaction(async trx => {
                const [user] = await trx('users')
                    .where({ id: req.userId })
                    .update({ is_verify: true, verified_at: new Date() })
                    .returning('*');

                await trx('otps')
                    .where({ otp, user_id: resultUser.id, type: 'sign-up' })
                    .andWhereRaw('LOWER(email) = LOWER(?)', [resultUser.email])
                    .del();

                return user;
            });

            const accessToken = generateAccessToken(updatedUser.id);
            const refreshToken = generateRefreshToken(updatedUser.id);

            const userDTO = new UserDTO(updatedUser.id, updatedUser.fullname, updatedUser.email, updatedUser.avatar, updatedUser.currency, updatedUser.country, updatedUser.language, updatedUser.is_need_password);

            await knex('tokens').insert({
                user_id: updatedUser.id,
                refresh_token: refreshToken,
                expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
            })
            responseSuccess(res, {
                user: userDTO,
                access_token: accessToken,
                refresh_token: refreshToken,
            });
        } catch (error) {
            console.error('Error updating user:', error);
            responseFailure(res, 500, 'Internal server error');
        }
    };

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

            responseSuccess(res, {
                access_token: accessToken,
                refresh_token: refresh_token,
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

    async updateUser(req: Request, res: Response) {
        try {
            const { fullname, avatar, currency } = req.body;

            const updateData: Record<string, any> = {
                fullname: fullname,
                avatar: avatar,
                currency: currency,
                updated_at: knex.fn.now(),
            };

            Object.keys(updateData).forEach((key) => {
                if (updateData[key] === null || updateData[key] === undefined) {
                    delete updateData[key];
                }
            });

            const response = await knex('users')
                .where({ 'id': req.userId })
                .update(updateData)
                .returning('*');

            const user = response[0];
            const userDTO = new UserDTO(user.id, user.fullname, user.email, user.avatar, user.currency, user.country, user.language, user.is_need_password);

            responseSuccess(res, userDTO);
        } catch (error) {
            console.error('Error updating user:', error);
            responseFailure(res, 500, 'Internal server error');
        }
    };

    async updateLocal(req: Request, res: Response) {
        try {
            const { country, language } = req.body;

            if (!language) {
                responseFailure(res, 400, 'Language is required');
                return
            }

            if (!country) {
                responseFailure(res, 400, 'Country is required');
                return
            }

            const updateData: Record<string, any> = {
                country: country,
                language: language,
                updated_at: knex.fn.now(),
            };

            Object.keys(updateData).forEach((key) => {
                if (updateData[key] === null || updateData[key] === undefined) {
                    delete updateData[key];
                }
            });

            const response = await knex('users')
                .where({ 'id': req.userId })
                .update(updateData)
                .returning('*');

            const user = response[0];
            const userDTO = new UserDTO(user.id, user.fullname, user.email, user.avatar, user.currency, user.country, user.language, user.is_need_password);

            responseSuccess(res, userDTO);
        } catch (error) {
            console.error('Error updating user:', error);
            responseFailure(res, 500, 'Internal server error');
        }
    };

    async checkUser(req: Request, res: Response) {
        try {
            const { email } = req.query;

            if (!email) {
                responseFailure(res, 400, 'Email is required');
                return
            }

            const result = await knex('users')
                .whereRaw('LOWER(email) = LOWER(?)', [email])
                .first();

            if (!result) {
                responseFailure(res, 400, 'Do not have account');
                return
            }

            const userDTO = new UserDTO(result.id, result.fullname, result.email, result.avatar, result.currency, result.country, result.language, result.is_need_password);

            responseSuccess(res, userDTO);
        } catch (error) {
            console.error('Error updating user:', error);
            responseFailure(res, 500, 'Internal server error');
        }
    };

    async resendOTP(req: Request, res: Response) {
        try {
            const { type, email } = req.body;

            if (!email || !type) {
                responseFailure(res, 400, `${!email ? 'Email' : 'Type'} is required`);
                return
            }

            const user = await knex('users')
                .whereRaw('LOWER(email) = LOWER(?)', [email])
                .first();

            if (!user) {
                responseFailure(res, 400, 'Invalid account');
                return;
            }

            const otp = Math.floor(100000 + Math.random() * 900000);
            const otpExpire = new Date(Date.now() + 2 * 60 * 1000);
            const accessToken = generateTemptAccessToken(user.id, type);

            await knex.transaction(async trx => {
                const previousOTP = await trx('otps').where({ email, user_id: user.id, type }).first();

                await trx('otps').where({ email, user_id: user.id, type }).del();

                await trx('otps').insert({
                    email: email,
                    user_id: user.id,
                    otp: otp,
                    type: type,
                    expired_at: otpExpire,
                    temp_password: previousOTP?.temp_password || null,
                });
            });

            const mailOptions = {
                from: config.EMAIL_USER,
                to: email,
                subject: 'Password reset OTP',
                text: `Your OTP (expires in 2 minutes): ${otp}`,
            };

            await transporter.sendMail(mailOptions);

            responseSuccess(res, { access_token: accessToken });
        } catch (error) {
            console.error('Error in resendOTP:', error);
            responseFailure(res, 500, 'Internal server error');
        }
    }


    async forgotPassword(req: Request, res: Response) {
        try {
            const { password, otp } = req.body;

            if (!password || !otp) {
                responseFailure(res, 400, 'Password and OTP are required');
                return;
            }

            const resultUser = await knex('users').where({ id: req.userId }).first();

            const otpRecord = await knex('otps')
                .where({ otp, user_id: req.userId, type: "forgot-password" })
                .andWhereRaw('LOWER(email) = LOWER(?)', [resultUser.email])
                .first();

            if (!otpRecord) {
                responseFailure(res, 400, 'Invalid OTP');
                return;
            }

            const now = new Date();
            const expiredAt = new Date(otpRecord.expired_at);
            if (expiredAt < now) {
                responseFailure(res, 400, 'Expired OTP');
                return;
            }

            const hashedPassword = await hashPassword(password);

            const updatedUser = await knex.transaction(async trx => {
                const updated = await trx('users')
                    .where({ id: req.userId })
                    .update({ password: hashedPassword })
                    .returning('*');

                await trx('otps')
                    .where({ otp, user_id: req.userId, type: "forgot-password" })
                    .del();

                return updated[0];
            });

            const userDTO = new UserDTO(
                updatedUser.id,
                updatedUser.fullname,
                updatedUser.email,
                updatedUser.avatar,
                updatedUser.currency,
                updatedUser.country,
                updatedUser.language,
                updatedUser.is_need_password
            );

            responseSuccess(res, userDTO);
        } catch (error) {
            console.error('Error in forgotPassword:', error);
            responseFailure(res, 500, 'Internal server error');
        }
    }

    async changePassword(req: Request, res: Response) {
        try {
            const { old_password, new_password } = req.body;

            if (!old_password || !new_password) {
                responseFailure(res, 400, 'Old and new password are required');
                return
            }

            const resultUser = await knex('users').where({ id: req.userId }).first();

            if (!resultUser) {
                responseFailure(res, 404, 'User not found');
                return
            }

            const isMatch = await bcrypt.compare(old_password, resultUser.password);

            if (!isMatch) {
                responseFailure(res, 400, 'Invalid old password');
                return
            }

            const otp = Math.floor(100000 + Math.random() * 900000);
            const otpExpier = new Date();
            otpExpier.setMinutes(otpExpier.getMinutes() + 2);

            const hashedNewPassword = await hashPassword(new_password);

            await knex.transaction(async trx => {
                await trx('otps')
                    .where({ user_id: req.userId, email: resultUser.email, type: 'change-password' })
                    .del();

                await trx('otps').insert({
                    email: resultUser.email,
                    user_id: req.userId,
                    otp: otp,
                    type: 'change-password',
                    expired_at: otpExpier,
                    temp_password: hashedNewPassword,
                });
            });

            const accessToken = generateTemptAccessToken(resultUser.id, "change-password");

            const mailOptions = {
                from: config.EMAIL_USER,
                to: resultUser.email,
                subject: 'Password change OTP',
                text: `Your OTP (It will expire after 2 minutes): ${otp}`,
            };

            await new Promise((resolve, reject) => {
                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) return reject(err);
                    resolve(info);
                });
            });

            responseSuccess(res, { access_token: accessToken });
        } catch (error) {
            console.error('Error in changePassword:', error);
            responseFailure(res, 500, 'Internal server error');
        }
    }

    async confirmPassword(req: Request, res: Response) {
        try {
            const { otp } = req.body;

            if (!otp) {
                responseFailure(res, 400, 'OTP is required');
                return
            }

            const resultUser = await knex('users').where({ id: req.userId }).first();

            const result = await knex('otps').where({ otp: otp, user_id: resultUser.id, type: "change-password" }).andWhereRaw('LOWER(email) = LOWER(?)', [resultUser.email]).first();

            if (!result) {
                responseFailure(res, 400, 'OTP invalid');
                return
            }

            const now = new Date();
            const expiredAt = new Date(result.expired_at);

            if (expiredAt < now) {
                responseFailure(res, 400, 'Expried OTP');
                return
            }

            const updatedUser = await knex.transaction(async trx => {
                const [user] = await trx('users')
                    .where({ id: req.userId })
                    .update({ password: result.temp_password, is_need_password: false })
                    .returning('*');

                await trx('otps')
                    .where({ otp, user_id: resultUser.id, type: 'change-password' })
                    .andWhereRaw('LOWER(email) = LOWER(?)', [resultUser.email])
                    .del();

                return user;
            });

            const userDTO = new UserDTO(updatedUser.id, updatedUser.fullname, updatedUser.email, updatedUser.avatar, updatedUser.currency, updatedUser.country, updatedUser.language, updatedUser.is_need_password);

            responseSuccess(res, userDTO);
        } catch (error) {
            console.error('Error updating user:', error);
            responseFailure(res, 500, 'Internal server error');
        }
    };

    async addPassword(req: Request, res: Response) {
        try {
            const { password } = req.body;

            if (!password) {
                responseFailure(res, 400, 'Password is required');
                return
            }

            const resultUser = await knex('users').where({ id: req.userId }).first();

            if (!resultUser) {
                responseFailure(res, 404, 'User not found');
                return
            }

            if (!resultUser.is_need_password) {
                responseFailure(res, 400, 'User already has a password');
                return
            }

            if (resultUser.sign_up_type !== "google") {
                responseFailure(res, 400, "Account isn't login with Google");
                return
            }

            const hashedPassword = await hashPassword(password);
            const otp = Math.floor(100000 + Math.random() * 900000);
            const otpExpier = new Date();
            otpExpier.setMinutes(otpExpier.getMinutes() + 2);
            await knex.transaction(async trx => {
                await trx('otps')
                    .where({ user_id: req.userId, email: resultUser.email, type: 'change-password' })
                    .del();
                await trx('otps').insert({
                    email: resultUser.email,
                    user_id: req.userId,
                    otp: otp,
                    type: 'change-password',
                    expired_at: otpExpier,
                    temp_password: hashedPassword,
                });
            });
            const accessToken = generateTemptAccessToken(resultUser.id, "change-password");
            const mailOptions = {
                from: config.EMAIL_USER,
                to: resultUser.email,
                subject: 'Add Password OTP',
                text: `Your OTP (It will expire after 2 minutes): ${otp}`,
            };
            await new Promise((resolve, reject) => {
                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) return reject(err);
                    resolve(info);
                });
            });
            responseSuccess(res, { access_token: accessToken });
        } catch (error) {
            console.error('Error in addPassword:', error);
            responseFailure(res, 500, 'Internal server error');
        }
    }
}

export default new AuthController();