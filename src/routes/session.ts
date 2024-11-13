import { Router, Request, Response } from "express";
import admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";
import { io } from "../socket";

const router = Router();

const createSession = async (req: Request, res: Response) => {
  const { userId, songId } = req.body; 

  const sessionId = uuidv4();
  await admin
    .firestore()
    .collection("sessions")
    .doc(sessionId)
    .set({
      active: true,
      songId: songId,
      connectedUsers: [userId], 
    });

  const songsSnapshot = await admin
    .firestore()
    .collection("songs")
    .doc(songId)
    .get();
  const songData = songsSnapshot.data();

  io.to(sessionId).emit("session-start", { sessionId, song: songData });

  res.status(201).json({ sessionId });
};

const joinSession = async (req: Request, res: Response) => {
  const { sessionId, userId } = req.body;

  try {
    const sessionRef = admin.firestore().collection("sessions").doc(sessionId);
    const session = await sessionRef.get();

    if (!session.exists || !session.data()?.active) {
      return res.status(404).json({ error: "Session not found or inactive" });
    }

    await sessionRef.update({
      connectedUsers: admin.firestore.FieldValue.arrayUnion(userId),
    });

    res.status(200).json({ message: "Joined session successfully" });
  } catch (error) {
    console.error("Error joining session:", error);
    res.status(500).json({ error: "Failed to join session" });
  }
};

const quitSession = async (req: Request, res: Response) => {
  const { sessionId } = req.body;

  await admin.firestore().collection("sessions").doc(sessionId).update({
    active: false,
    connectedUsers: [], 
  });

  io.to(sessionId).emit("session-end");

  res.status(200).json({ message: "Session ended" });
};

router.post("/create", createSession);
router.post("/join", joinSession as any);
router.post("/quit", quitSession);

export default router;
