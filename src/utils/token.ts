import {
  JwtPayload,
  PrivateKey,
  Secret,
  sign,
  SignOptions,
  verify,
  VerifyOptions,
} from "jsonwebtoken";
import { IUesr, roleType, userModel,revokeTokenModel, RevokeTokenRepo, UserRepo } from ".././DB";
import { AppErorr } from "./globelErorr";


export enum TokenType {
  Access = "access",
  Refresh = "refresh",
}

type GneratTokenType = {
  payload: string | object | Buffer<ArrayBufferLike>;
  secretOrPrivateKey: Secret | PrivateKey;
  options?: SignOptions;
};
type VerfyTokenType = {
  token: string;
  secretOrPublicKey: Buffer<ArrayBufferLike> | Secret;
  options?: VerifyOptions;
};

const _userModel = new UserRepo(userModel);
const _revokeToken = new RevokeTokenRepo(revokeTokenModel);

export const GneratToken = async ({
  payload,
  secretOrPrivateKey,
  options,
}: GneratTokenType): Promise<string> => {
  return sign(payload, secretOrPrivateKey, options);
};
export const VerfyToken = async ({
  token,
  secretOrPublicKey,
  options,
}: VerfyTokenType): Promise<string | JwtPayload> => {
  return verify(token, secretOrPublicKey, options);
};

export const accessSignetuer = (user: IUesr) => {
  if (user.role === roleType.User) {
    return process?.env?.USER_SEDNATRE_ACCESS!;
  } else if (user.role === roleType.Admin) {
    return process?.env?.ADMIN_SEDNATRE_ACCESS!;
  } else if (user.role === roleType.Developer) {
    return process?.env?.DEVELOPER_SEDNATRE_ACCESS!;
  }
};

export const refreshSignetuer = (user: IUesr) => {
  if (user.role === roleType.User) {
    return process?.env?.USER_SEDNATRE_REFRESH!;
  } else if (user.role === roleType.Admin) {
    return process?.env?.ADMIN_SEDNATRE_REFRESH!;
  } else if (user.role === roleType.Developer) {
    return process?.env?.DEVELOPER_SEDNATRE_REFRESH!;
  }
};
export const getSignatuer = async ({tokenType = TokenType.Access, prefix}:{tokenType?: TokenType, prefix: string}) => {
  if (tokenType === TokenType.Access) {
    if (prefix === process?.env?.USER_PREFIXE!) {
      return process?.env?.USER_SEDNATRE_ACCESS!;
    } else if (prefix === process?.env?.ADMIN_PREFIXE!) {
      return process?.env?.ADMIN_SEDNATRE_ACCESS!;
    } else if (prefix === process?.env?.DEVELOPER_PREFIXE!) {
      return process?.env?.DEVELOPER_SEDNATRE_ACCESS!;
    } else {
      return null;
    }
  } else if (tokenType === TokenType.Refresh) {
    if (prefix === process?.env?.USER_PREFIXE!) {
      return process?.env?.USER_SEDNATRE_REFRESH!;
    } else if (prefix === process?.env?.ADMIN_PREFIXE!) {
      return process?.env?.ADMIN_SEDNATRE_REFRESH!;
    } else if (prefix === process?.env?.DEVELOPER_PREFIXE!) {
      return process?.env?.DEVELOPER_SEDNATRE_REFRESH!;
    } else {
      return null;
    }
  } else {
    throw new AppErorr("Wrong prifex", 404);
  }
};
export const decodeAndFatchToken = async (token: string, signatuer: string) => {
  const decoded = await VerfyToken({ token, secretOrPublicKey: signatuer });
  if (!decoded || typeof decoded === "string") {
    throw new AppErorr("Fail to decoded", 404);
  }
  
  const user = await _userModel.findOne({ email: decoded?.email! });
  if (!user) {
    throw new AppErorr("User not found", 404);
  }
  
  if (await _revokeToken.findOne({ tokenId: decoded.jti })) {
    throw new AppErorr("token has been revoked", 404);
  }

if (user?.chengeCredentiles!) {
    if (user?.chengeCredentiles!.getTime() > decoded?.iat! * 1000) {
    throw new AppErorr("u have an old token", 404);
  }

}

  if (!user.confermed) {
    throw new AppErorr("User must conferm", 404);
  }
  return { decoded, user };

};
