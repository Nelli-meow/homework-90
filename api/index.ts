import express from "express";
import mongoose from "mongoose";
import config from "./config";
import cors from 'cors';
import expressWs from "express-ws";
import WebSocket from "ws";

const app = express();
expressWs(app);

const port =  8000;

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const router = express.Router();

const connectedClients: WebSocket[] = [];

router.ws('/canvas', (ws, req) => {
    connectedClients.push(ws);
    console.log('Client connected. Clients total - ', connectedClients.length);

    ws.on('message', (message) => {
        connectedClients.forEach((clientWS) => {
           clientWS.send(message);
        });
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        const index = connectedClients.indexOf(ws);
        connectedClients.splice(index, 1);
        console.log('client total - ' , connectedClients.length);
    });
});

app.use(router);

const run = async () => {
    await mongoose.connect(config.db);

    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
}

run().catch((err) => console.log(err));
