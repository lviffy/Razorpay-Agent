import express from "express";

export const razorpayRawBodyMiddleware = express.raw({ type: "application/json" });

export const whatsappVerifyBodyMiddleware = express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf.toString("utf8");
  },
});
