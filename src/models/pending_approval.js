import mongoose from "mongoose";

const pendingApprovalSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "posts",
  },
});

const PendingApproval = mongoose.model(
  "pending_approvals",
  pendingApprovalSchema,
  "pending_approvals"
);

export default PendingApproval;
