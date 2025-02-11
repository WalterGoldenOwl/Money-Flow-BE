import dotenv from 'dotenv';

dotenv.config();

declare global {
    namespace Express {
        interface Request {
            userId: any;
        }
    }
}

class Config {
    PORT = process.env.PORT!;
    DATABASE_URL = process.env.DATABASE_URL!;
    ACCESS_TOKEN_PRIVATE_KEY = process.env.ACCESS_TOKEN_PRIVATE_KEY!;
    REFRESH_TOKEN_PRIVATE_KEY = process.env.REFRESH_TOKEN_PRIVATE_KEY!;
}

export default new Config;
