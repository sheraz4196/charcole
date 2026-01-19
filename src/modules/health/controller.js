import { sendSuccess } from "../../utils/response.js";
export const getHealth = (req, res) => {
  sendSuccess(res, {
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
};
