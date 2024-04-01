export const HandleResponse = {
  clientSuccess: async (res, message, data, total, session) => {
    if (session != null) {
      await session.commitTransaction();
      session.endSession();
    }
    let body = { success: false };
    if (message != null) body["message"] = message;
    if (data != null) body["data"] = data;
    if (total != null) body["total"] = total;
    return res.status(200).json(body);
  },
  clientError: async (res, message, session) => {
    if (session != null) {
      await session.abortTransaction();
      session.endSession();
    }
    return res.status(400).json({
      success: false,
      message: message,
    });
  },
  serverError: async (res, session) => {
    if (session != null) {
      await session.abortTransaction();
      session.endSession();
    }
    return res.status(500).json({
      success: false,
      message: "Server internal error",
    });
  },
};
