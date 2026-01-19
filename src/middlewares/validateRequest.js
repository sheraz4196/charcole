import { sendValidationError } from "../utils/response.js";

export const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      req.validatedData = validated;
      next();
    } catch (error) {
      if (error.name === "ZodError") {
        return sendValidationError(res, error.errors);
      }
      next(error);
    }
  };
};
