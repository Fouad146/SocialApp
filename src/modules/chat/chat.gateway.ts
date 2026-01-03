import { Server, Socket } from "socket.io";
import { SokecketWithuser } from "../gateway/getway.interface";
import { ChatEvents } from "./chat.event";

export class ChatGateWay {
    private _ChatEvents = new ChatEvents()
  constructor() {}
  register = (socket: SokecketWithuser,io:Server) => {
    this._ChatEvents.sayHi(socket,io);
    this._ChatEvents.sendMessage(socket,io);
    this._ChatEvents.join_room(socket,io);
    this._ChatEvents.sendGroupMessage(socket,io);
  };
}
