import mongoose from "mongoose";
const user = new mongoose.Schema({
  fcm_tokens: {
    type: Array,
    default: [],
  },
  blockAllUserId: [
    {
      type: mongoose.Schema.Types.ObjectId,
      default: [],
    },
  ],
});

const User = mongoose.model("users", user, "users");
export default User;
