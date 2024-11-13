import { Router } from 'express';
import admin from 'firebase-admin';

const router = Router();

router.post('/signup', async (req, res) => {
    const { email, password, instrument, role } = req.body;
    try {
        const userRecord = await admin.auth().createUser({
            email,
            password,
        });

        await admin.firestore().collection('users').doc(userRecord.uid).set({
            email,
            instrument,
            role,
        });

        res.status(201).json({ uid: userRecord.uid });
    } catch (error) {
        res.status(400).json({ error });
    }
});

router.post('/login', async (req, res) => {
    res.status(200).json({ message: 'Login endpoint' });
});

export default router;





