import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const getSocket = () => {
  if (!socket && typeof window !== 'undefined') {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10
    });
  }
  return socket;
};

export const joinExecutionRoom = (executionId) => {
  const s = getSocket();
  if (s) {
    s.emit('join_execution', executionId);
  }
};

export const leaveExecutionRoom = (executionId) => {
  const s = getSocket();
  if (s) {
    s.emit('leave_execution', executionId);
  }
};
