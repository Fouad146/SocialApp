import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import {
  AppErorr,
  decodeAndFatchToken,
  getSignatuer,
  TokenType,
} from "../../utils";
import { SokecketWithuser } from "./getway.interface";
import { ChatGateWay } from "../chat/chat.gateway.js";
let io: Server|undefined=undefined;

export const connectionSockets = new Map<string, string[]>();

export const initializationIo = (httpServer: HttpServer) => {

   io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PATCH", "DELETE"],
      credentials: true,
    },
  });

  io.use(async (socket: SokecketWithuser, next) => {
    try {
      const { authorization } = socket.handshake.auth;
      const [prefix, token] = authorization?.split(" ") || [];
      if (!prefix || !token) {
        return next(new AppErorr("Token not found", 404));
      }
      const signature = await getSignatuer({ prefix });
      if (!signature) {
        return next(new AppErorr("invaled signature", 404));
      }
      const { user, decoded } = await decodeAndFatchToken(token, signature);
      const socketIds = connectionSockets.get(user?._id?.toString()) || [];
      socketIds.push(socket.id);
      connectionSockets.set(user?._id?.toString(), socketIds);
      socket.user = user;
      socket.decoded = decoded;
      next();
    } catch (error: any) {
      next(error);
    }
  });

  const chatGatWay = new ChatGateWay();

  io.on("connection", (socket: SokecketWithuser) => {
    console.log(connectionSockets);
    chatGatWay.register(socket,getIo());

    const removeSocket = () => {
      let reminingTabs = connectionSockets
        ?.get(socket?.user?._id?.toString() || "")
        ?.filter((tab) => {
          return tab !== socket.id;
        });
      if (reminingTabs?.length) {
        connectionSockets.set(
          socket?.user?._id?.toString() || "",
          reminingTabs
        );
      } else {
        getIo().emit("offline_user", { userId: socket?.user?._id?.toString() });
        console.log({ after: connectionSockets });
      }
    };
    socket.on("disconnect", () => {
      removeSocket();
    });
  });
};
const getIo=()=>{
  if (!io) {
    throw new AppErorr("Io not initialized", 500);
  }
    return io;
  
}