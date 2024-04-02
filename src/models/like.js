import mongoose from "mongoose";
import User from "./user.js";
import Post from "./post.js";

const like = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Post,
    required: true,
  },
  userLikeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User,
    required: true,
  },
  time: {
    type: String,
  },
});

const Like = mongoose.model("likes", like, "likes");
export default Like;
