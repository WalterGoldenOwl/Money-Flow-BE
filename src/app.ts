import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { Client } from "pg";
import router from "./routers";
// import cors from "cors";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;
export const client = new Client(DATABASE_URL);

app.use(express.urlencoded({ extended: true }));

// app.use(
//   cors({
//     origin: "http://localhost:3000",
//     credentials: true,
//     methods: ["GET", "PUT", "POST", "DELETE", "UPDATE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

app.get("/", (req: Request, res: Response) => {
    res.send("Express + TypeScript Server");
});

app.use(express.json());

async function StartApp() {

    await client.connect().then(() => { console.log('Connected to PostgreSQL database!'); }).catch((err) => { console.error('Error connecting to the database:', err); });

    app.use("/api", router);

    app.listen(port, () => {
        console.info(`Server listening on port ${port}`);
    });
}

StartApp();