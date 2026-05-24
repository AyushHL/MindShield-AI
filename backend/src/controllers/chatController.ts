import { Request, Response } from "express";

import { generateReply} from "../services/llamaServices";

export const chatController = async (
  req: Request,
  res: Response
): Promise<void> => {

  try {

    const { messages } = req.body;

    console.log(messages);

    const reply = await generateReply(messages);

    res.json({
      reply
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server Error"
    });
  }
};