import { hash, compare } from "bcrypt";

export const Hashing = async (
  data: string | Buffer<ArrayBufferLike>,
  saltOrRounds?: string | number
): Promise<string> => {
  return await hash(data, (saltOrRounds = Number(process.env.SALTROUNDS)));
};

export const Comparing = async (data: string | Buffer, encrypted: string) => {
  return await compare(data, encrypted);
};
