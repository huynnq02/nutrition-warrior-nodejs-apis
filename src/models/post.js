import mongoose from "mongoose";

const post = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    authorFCMToken: {
      type: String,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    postingTime: {
      type: String,
      required: true,
    },
    likeAllUserId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        default: [],
      },
    ],
    likeCounts: {
      type: Number,
      default: 0,
    },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        default: [],
      },
    ],
    images: {
      type: Array,
      default: [],
    },
    emoji: {
      type: String,
    },
    view: {
      type: Number,
      default: 0,
    },
    isLike: {
      type: Boolean,
      default: false,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
    deleteTime: {
      type: String,
    },

    isPublic: {
      type: Boolean,
      default: true,
    },
    isBookmark: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
    },
    pendingApproval: {
      type: Boolean,
    },
  },
  {
    timestamps: true,
  }
);
post.pre("save", async function (next) {
  try {
    const author = await this.model("user").findById(this.author);
    this.authorFCMToken = author.fcm_tokens[0];
    next();
  } catch (error) {
    next(error);
  }
});

const Post = mongoose.model("posts", post, "posts");

export default Post;
