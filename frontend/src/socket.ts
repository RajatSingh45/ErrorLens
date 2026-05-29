import { io } from "socket.io-client";

const buildSocketUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;

  let base = envUrl ? envUrl.replace(/\/api\/?$/, "") : window.location.origin;

  if (typeof window !== "undefined") {
    const pageProtocol = window.location.protocol; 
    if (pageProtocol === "https:" && base.startsWith("http://")) {
      base = base.replace("http://", "https://");
    }
    if (pageProtocol === "http:" && base.startsWith("https://")) {
      base = base.replace("https://", "http://");
    }
  }

  // trim trailing slash
  return base.replace(/\/$/, "");
};

const socket = io(buildSocketUrl(), {
  transports: ["websocket"],
});

export default socket;