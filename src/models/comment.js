import mongoose from "mongoose";
import User from "./user.js";
import Post from "./post.js";
import moment from "moment";

const comment = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  postId: {
    // type: mongoose.Schema.Types.ObjectId,
    // ref: Post,
    type: String,
    required: true,
  },
  userCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User,
    required: true,
  },

  time: {
    type: String,
  },

  userPostId: {
    type: String,
  },

  parentCommentId: {
    type: String,
    // ref: "comment",
  },
  childrenComments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "comment",
      default: [],
    },
  ],
  replyType: {
    // post, comment
    type: String,
  },
});

const Comment = mongoose.model("comments", comment, "comments");
export default Comment;
