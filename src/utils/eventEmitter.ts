import EventEmitter from "events";
import { emailTemp, SendEmail } from "../service";
import { GneratToken } from "./token";
import { deleteOneFile, getFile } from "./s3.config";
import { userModel, UserRepo } from "../DB";

export const eventEmitter = new EventEmitter();
const _userModel = new UserRepo(userModel);

eventEmitter.on("ConfermEmail", async (data) => {
  try {
    const { email, OTP } = data;
    await SendEmail({
      to: email,
      subject: "Conferming Email",
      html: emailTemp(OTP as unknown as string, "Confrm your Email"),
    });

    console.log("data received successfully.");
  } catch (error) {
    console.log({ err: error });
  }
});

eventEmitter.on("ConfermEmail_2", async (data) => {
  const { email } = data;
  const token = await GneratToken({
    payload: { email },
    secretOrPrivateKey: process.env.CONFERMEMAIL as string,
    options: { expiresIn: 60 * 60 * 1000 },
  });
  const link = `${process.env.USER_BASE_URL}/confirmEmail/${token}`;

  await SendEmail({
    to: email,
    subject: "Conferming Email",
    html: emailTemp(link as unknown as string, "Confrm your Email"),
  });

  console.log("data received successfully.");
});

eventEmitter.on("resetPassword", async (data) => {
  try {
    const { email, otp } = data;
    const link = `${process.env.USER_BASE_URL}/resetPassword`;

    await SendEmail({
      to: email,
      subject: "Forget Password",
      html: emailTemp(
        otp as unknown as string,
        "Go to reset your password",
        link
      ),
    });

    console.log("data received successfully.");
  } catch (error) {
    console.log({ err: error });
  }
});
eventEmitter.on("UploadProfileImage", async (data) => {
  const { userId, oldKey, Key, expireIn } = data;
  console.log(data);

  setTimeout(async () => {
    try {
      await getFile({ Key });
      await _userModel.findUserAndUpdate(
        { _id: userId },
        { $unset: { tempProfileImage: "" } }
      );
      if (oldKey) {
        await deleteOneFile({ Key: oldKey });
      }
    } catch (error: any) {
      console.log({ error });
      if (error?.Code! == "NoSuchKey") {
        if (!oldKey) {
          await _userModel.findUserAndUpdate(
            { _id: userId },
            { $unset: { profileImage: "" } }
          );
        } else {
          await _userModel.findUserAndUpdate(
            { _id: userId },
            { $set: { profileImage: oldKey }, $unset: { tempProfileImage: "" } }
          );
        }
      }
    }
  }, expireIn * 1000);
});
