import express, { Express, NextFunction, Request, Response } from "express";
import router from "./routers";
import config from './config';
import * as admin from 'firebase-admin';
// import cors from "cors";

var serviceAccount = require("../firebase.config.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const app: Express = express();
const port = config.PORT || 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
    res.on('finish', () => {
        console.log(`API Route: ${req.method} ${req.originalUrl} - Status Code: ${res.statusCode}`);
    });
    next();
});

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

async function StartApp() {

    app.use("/api", router);

    app.listen(port, () => {
        console.info(`Server listening on port ${port}`);
    });
}

StartApp();