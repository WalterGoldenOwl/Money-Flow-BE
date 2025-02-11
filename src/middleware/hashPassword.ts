import bcrypt from 'bcrypt';

export default async function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    try {
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    } catch (err: any) {
        throw new Error(`Error: ${err.message}`);
    }
}