import { Response, Request, NextFunction } from "express";
import {
  AppErorr,
  TokenType,
  decodeAndFatchToken,
  getSignatuer,
} from "../utils";

export const Authentecation = (tokenType: TokenType = TokenType.Access) => {
  
  return async (req: Request, res: Response, next: NextFunction) => {
    const { authorization } = req.headers;
    const [prefix, token] = authorization?.split(" ") || [];
    if (!prefix || !token) {
      throw new AppErorr("Bad token", 409);
    }
    
    const signatuer = await getSignatuer({tokenType , prefix});
    const {decoded,user} = await decodeAndFatchToken( token , signatuer as string );
    if (!decoded) {
      throw new AppErorr("Fail to decoded", 404);
    }
    
    
    
    req.user = user;
    req.decoded = decoded;
    next();
  };
};
