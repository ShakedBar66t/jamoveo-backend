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
exports.io = exports.initializeSocket = void 0;
const socket_io_1 = require("socket.io");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
let io;
const initializeSocket = (server) => {
    exports.io = io = new socket_io_1.Server(server, {
        cors: {
            origin: "*",
        },
    });
    io.on("connection", (socket) => {
        socket.on("join-session", (_a) => __awaiter(void 0, [_a], void 0, function* ({ sessionId, userId }) {
            socket.join(sessionId);
            socket.join(`user:${userId}`);
            try {
                const sessionRef = firebase_admin_1.default
                    .firestore()
                    .collection("sessions")
                    .doc(sessionId);
                yield sessionRef.update({
                    connectedUsers: firebase_admin_1.default.firestore.FieldValue.arrayUnion(userId),
                });
            }
            catch (error) {
                console.error("Error updating session users:", error);
            }
        }));
        socket.on("leave-session", (_a) => __awaiter(void 0, [_a], void 0, function* ({ sessionId, userId }) {
            socket.leave(sessionId);
            socket.leave(`user:${userId}`);
            try {
                const sessionRef = firebase_admin_1.default
                    .firestore()
                    .collection("sessions")
                    .doc(sessionId);
                yield sessionRef.update({
                    connectedUsers: firebase_admin_1.default.firestore.FieldValue.arrayRemove(userId),
                });
            }
            catch (error) {
                console.error("Error removing user from session:", error);
            }
        }));
        socket.on("update-auto-scroll", ({ sessionId, autoScroll, scrollSpeed }) => {
            // Broadcast to all clients in the session
            io.to(sessionId).emit("update-auto-scroll", {
                autoScroll,
                scrollSpeed,
            });
        });
        socket.on("disconnect", () => {
        });
        socket.on("session-start", ({ sessionId }) => {
            io.emit("session-start", sessionId);
        });
    });
    return io;
};
exports.initializeSocket = initializeSocket;
