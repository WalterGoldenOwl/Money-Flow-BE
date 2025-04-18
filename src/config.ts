import dotenv from 'dotenv';

dotenv.config();

declare global {
    namespace Express {
        interface Request {
            userId: any;
            deviceID: any;
        }
    }
}

class Config {
    PORT = process.env.PORT!;
    DATABASE_URL = process.env.DATABASE_URL!;
    ACCESS_TOKEN_PRIVATE_KEY = process.env.ACCESS_TOKEN_PRIVATE_KEY!;
    REFRESH_TOKEN_PRIVATE_KEY = process.env.REFRESH_TOKEN_PRIVATE_KEY!;
    EMAIL_SERVICE = process.env.EMAIL_SERVICE!;
    EMAIL_USER = process.env.EMAIL_USER!;
    EMAIL_PASS = process.env.EMAIL_PASS!;
    GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
}

export default new Config;
