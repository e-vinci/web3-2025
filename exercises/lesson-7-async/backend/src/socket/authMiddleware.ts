import { Socket } from "socket.io";
import { verifyToken } from "@/api/auth/authService";

export interface AuthenticatedSocket extends Socket {
  user?: {
    userId: number;
    email: string;
  };
}

export function authenticateSocket(
  socket: Socket,
  next: (err?: Error) => void
) {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication required"));
  }

  try {
    const user = verifyToken(token);
    (socket as AuthenticatedSocket).user = user;
    next();
  } catch (error) {
    next(new Error("Invalid token"));
  }
}
