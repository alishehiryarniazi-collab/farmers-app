import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { prisma } from "./prisma";
import { verifyToken } from "./utils/jwt";
import { env } from "./env";

let ioInstance: Server | undefined;

export function getIo(): Server | undefined {
  return ioInstance;
}

export function attachSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.corsOrigin, credentials: true },
  });
  ioInstance = io;

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) throw new Error("Missing token");
      socket.data.auth = verifyToken(token);
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const { userId } = socket.data.auth as { userId: string };
    socket.join(`user:${userId}`);

    socket.on("conversation:join", async (conversationId: string) => {
      try {
        const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
        if (!conversation || (conversation.farmerId !== userId && conversation.buyerId !== userId)) return;
        socket.join(`conversation:${conversationId}`);
      } catch (err) {
        console.error("conversation:join failed", err);
      }
    });

    socket.on("message:send", async (payload: { conversationId: string; body: string }) => {
      try {
        const { conversationId, body } = payload;
        if (!body?.trim()) return;

        const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
        if (!conversation || (conversation.farmerId !== userId && conversation.buyerId !== userId)) return;

        const message = await prisma.message.create({
          data: { conversationId, senderId: userId, body: body.trim() },
          include: { sender: { select: { id: true, name: true, role: true } } },
        });

        io.to(`conversation:${conversationId}`).emit("message:new", message);

        const otherUserId = conversation.farmerId === userId ? conversation.buyerId : conversation.farmerId;
        io.to(`user:${otherUserId}`).emit("conversation:updated", { conversationId, message });

        const notification = await prisma.notification.create({
          data: {
            userId: otherUserId,
            type: "NEW_MESSAGE",
            title: `New message from ${message.sender.name}`,
            body: message.body,
            link: `/messages/${conversationId}`,
          },
        });
        io.to(`user:${otherUserId}`).emit("notification:new", notification);
      } catch (err) {
        console.error("message:send failed", err);
      }
    });
  });

  return io;
}
