import express from 'express';
import path from 'path';
import http from 'http';
import cors from 'cors';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { initializeSocket } from './socket';
import authRoutes from './routes/auth';
import sessionRoutes from './routes/session';
import songRoutes from './routes/songs';

dotenv.config();

const app = express();
const server = http.createServer(app);

initializeSocket(server);

app.use(cors({
    origin: '*'
}));
app.use(express.json());

try {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string))
    });
} catch (error) {
    console.error('Error initializing Firebase Admin:', error);
}

app.use(express.static(path.join(__dirname, '../public')))

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/songs', songRoutes);

app.get('/*', (req, res) => {
    res.sendFile(path.resolve('public', 'index.html'), (err) => {
        if (err) {
            res.status(500).send(err)
        }
    })
})

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
