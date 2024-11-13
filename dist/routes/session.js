"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const uuid_1 = require("uuid");
const socket_1 = require("../socket");
const router = (0, express_1.Router)();
const createSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, songId } = req.body;
    const sessionId = (0, uuid_1.v4)();
    yield firebase_admin_1.default
        .firestore()
        .collection("sessions")
        .doc(sessionId)
        .set({
        active: true,
        songId: songId,
        connectedUsers: [userId],
    });
    const songsSnapshot = yield firebase_admin_1.default
        .firestore()
        .collection("songs")
        .doc(songId)
        .get();
    const songData = songsSnapshot.data();
    socket_1.io.to(sessionId).emit("session-start", { sessionId, song: songData });
    res.status(201).json({ sessionId });
});
const joinSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { sessionId, userId } = req.body;
    try {
        const sessionRef = firebase_admin_1.default.firestore().collection("sessions").doc(sessionId);
        const session = yield sessionRef.get();
        if (!session.exists || !((_a = session.data()) === null || _a === void 0 ? void 0 : _a.active)) {
            return res.status(404).json({ error: "Session not found or inactive" });
        }
        yield sessionRef.update({
            connectedUsers: firebase_admin_1.default.firestore.FieldValue.arrayUnion(userId),
        });
        res.status(200).json({ message: "Joined session successfully" });
    }
    catch (error) {
        console.error("Error joining session:", error);
        res.status(500).json({ error: "Failed to join session" });
    }
});
const quitSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sessionId } = req.body;
    yield firebase_admin_1.default.firestore().collection("sessions").doc(sessionId).update({
        active: false,
        connectedUsers: [],
    });
    socket_1.io.to(sessionId).emit("session-end");
    res.status(200).json({ message: "Session ended" });
});
router.post("/create", createSession);
router.post("/join", joinSession);
router.post("/quit", quitSession);
exports.default = router;
