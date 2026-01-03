import z from "zod";
import { genderType } from "../../DB/models/user.model.js";
import { flagType } from "../../DB";
import { Types } from "mongoose";

export const signUpSchima = {
  body: z
    .object({
      firstName: z.string().min(2).max(15).trim(),
      lastName: z.string().min(2).max(15).trim(),
      email: z.email(),
      password: z.string(),
      confirmPassword: z.string(),
      gender: z
        .enum([genderType.Male, genderType.Female])
        .default(genderType.Male),
      age: z.number().min(18).max(60),
      phone: z.string(),
    })
    .superRefine((data, ctx) => {
      if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: "custom",
          message: "Password not match",
          path: ["Confarm password"],
        });
      }
    }),
};

/////////////////////////////////////////////////////////////////////////////////

export const OtpSchma = {
  body: z
    .object({
      email: z.email(),
      otp: z.string(),
    })
    .required(),
};

/////////////////////////////////////////////////////////////////////////////////

export const signInSchima = {
  body: z
    .object({
      email: z.email(),
      password: z.string(),
    })
    .required(),
};

/////////////////////////////////////////////////////////////////////////////////
export const logOutSchima = {
  body: z
    .object({
      flag: z.enum(flagType),
    })
    .required(),
};

/////////////////////////////////////////////////////////////////////////////////
export const forgetPasswordSchima = {
  body: z
    .object({
      email: z.email(),
    })
    .required(),
};

/////////////////////////////////////////////////////////////////////////////////
export const resetPasswordSchima = {
  body: z
    .object({
      email: z.email(),
      otp: z.string(),
      newPassword: z.string(),
      confirmPassword: z.string(),
    })
    .required()
    .superRefine((data, ctx) => {
      if (data.newPassword !== data.confirmPassword) {
        ctx.addIssue({
          code: "custom",
          message: "password not match",
          path: ["conferm password"],
        });
      }
    }),
  params: z.object({
    token: z.string().optional(),
  }),
};

/////////////////////////////////////////////////////////////////////////////////
export const updatePasswordSchima = {
  body: z
    .object({
      lastPassword: z.string(),
      newPassword: z.string(),
      confirmPassword: z.string(),
    })
    .required()
    .superRefine((data, ctx) => {
      if (data.newPassword !== data.confirmPassword) {
        ctx.addIssue({
          code: "custom",
          message: "password not match",
          path: ["conferm password"],
        });
        if (data.lastPassword === data.newPassword) {
          ctx.addIssue({
            code: "custom",
            message: "don`t repet your password",
            path: ["new password"],
          });
        }
      }
    }),
};
/////////////////////////////////////////////////////////////////////////////////
export const freezeAccountSchima = {
  params: z.strictObject({
    userId: z.string().optional(),
  })
  .refine(
    (value) => {
      // لو مفيش userId → valid
      if (!value.userId) return true;

      // لو موجود → لازم يكون ObjectId صحيح
      return Types.ObjectId.isValid(value.userId);
    },
    {
      message: "Invalid user id",
      path: ["userId"],
    }
  ),
};

/////////////////////////////////////////////////////////////////////////////////

export type siginUptype = z.infer<typeof signUpSchima.body>;
export type signIntype = z.infer<typeof signInSchima.body>;
export type Otptype = z.infer<typeof OtpSchma.body>;
export type logOuttype = z.infer<typeof logOutSchima.body>;
export type forgetPasswordtype = z.infer<typeof forgetPasswordSchima.body>;
export type resetPasswordtype = z.infer<typeof resetPasswordSchima.body>;
export type resetPasswordPramstype = z.infer<typeof resetPasswordSchima.params>;
export type updatePasswordtype = z.infer<typeof updatePasswordSchima.body>;
export type freezeAccounttype = z.infer<typeof freezeAccountSchima.params>;
