import { Server } from "socket.io";
import { SokecketWithuser } from "../gateway/getway.interface";
import { ChateService } from "./chat.service";

export class ChatEvents {
  private _ChatService = new ChateService();
    constructor(){ }
    sayHi=(socket: SokecketWithuser,io:Server) => {
        return socket.on("sayHi", (data, ) => {
          this._ChatService.sayHi(data,socket,io);
          
        });

}
    sendMessage=(socket: SokecketWithuser,io:Server) => {
        return socket.on("sendMessage", (data, ) => {
          this._ChatService.sendMessage(data,socket,io);
          
        });

}
    join_room=(socket: SokecketWithuser,io:Server) => {
        return socket.on("join_room", (data, ) => {
          this._ChatService.join_room(data,socket,io);
          
        });
        
      }
      sendGroupMessage=(socket: SokecketWithuser,io:Server) => {
          return socket.on("sendGroupMessage", (data, ) => {
            this._ChatService.sendGroupMessage(data,socket,io);
            
          });
}
}