import { io, type Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function connectSocket(token: string): Socket {
  return io(SOCKET_URL, { auth: { token }, autoConnect: true });
}
