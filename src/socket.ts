import { Server } from "socket.io";
import http from "http";
import admin from "firebase-admin";

let io: Server;

export const initializeSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {

    socket.on("join-session", async ({ sessionId, userId }) => {

      socket.join(sessionId);
      socket.join(`user:${userId}`);

      try {
        const sessionRef = admin
          .firestore()
          .collection("sessions")
          .doc(sessionId);
        await sessionRef.update({
          connectedUsers: admin.firestore.FieldValue.arrayUnion(userId),
        });
      } catch (error) {
        console.error("Error updating session users:", error);
      }
    });

    socket.on("leave-session", async ({ sessionId, userId }) => {

      socket.leave(sessionId);
      socket.leave(`user:${userId}`);

      try {
        const sessionRef = admin
          .firestore()
          .collection("sessions")
          .doc(sessionId);
        await sessionRef.update({
          connectedUsers: admin.firestore.FieldValue.arrayRemove(userId),
        });
      } catch (error) {
        console.error("Error removing user from session:", error);
      }
    });

    socket.on(
      "update-auto-scroll",
      ({ sessionId, autoScroll, scrollSpeed }) => {
        // Broadcast to all clients in the session
        io.to(sessionId).emit("update-auto-scroll", {
          autoScroll,
          scrollSpeed,
        });
      }
    );

    socket.on("disconnect", () => {
    });

    socket.on("session-start", ({ sessionId }) => {
      io.emit("session-start", sessionId);
    });
  });

  return io;
};

export { io };
