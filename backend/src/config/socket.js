import { Server } from "socket.io";

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });

    // Allow worker processes to ask the server to rebroadcast events to all connected clients.
    socket.on("worker_broadcast", (payload) => {
      try {
        const eventName = payload?.event || "error_processed";
        const data = payload?.data;
        console.log("Worker requested broadcast:", eventName);
        io.emit(eventName, data);
      } catch (err) {
        console.error("Failed to rebroadcast worker event:", err.message);
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }

  return io;
};

export { initSocket, getIO };