import Comment from "../models/comment.js";
import User from "../models/user.js";
import Post from "../models/post.js";

export const CommentController = {
  //Region create Comment
  addComment: async (req, res) => {
    const data = new Comment({
      postId: req.params.postId,
      userCommentId: req.params.userCommentId,
      time: req.body.time,
      replyType: req.body.replyType,
      content: req.body.content,
      userPostId: req.body.userPostId,
    });
    try {
      const userComment = await User.findById(req.params.userCommentId);

      if (data.replyType === "comment") {
        const parentComment = await Comment.findById(
          req.params.parentCommentId
        );
        const userIdParentComment = parentComment.userCommentId;
        const userParentComment = await User.findById(userIdParentComment);
        const fcm_tokens = userParentComment.fcm_tokens;
        let parentCommentId = req.params.parentCommentId;
        data.parentCommentId = parentCommentId;
        const createdData = await Comment.create(data);
        await Comment.findByIdAndUpdate(
          { _id: req.params.parentCommentId },
          { $push: { childrenComments: createdData._id } },
          { new: true }
        );
        // const text = userComment.name + " " + NOTIFICATION_TEXT.COMMENT_COMMENT;
        // if (userIdParentComment != req.params.userCommentId) {
        //   PushNotifyController.sendNotification(text, fcm_tokens, "Thông báo");
        //   const data = new Notification({
        //     receiver: userIdParentComment,
        //     author: req.params.userCommentId,
        //     type: "comment",
        //     text: text,
        //   });
        //   await Notification.create(data);
        // }
      } else if (data.replyType === "post") {
        const userPostId = await User.findById(req.body.userPostId);
        const fcm_tokens = userPostId.fcm_tokens;
        data.parentCommentId = "";
        const createdData = await Comment.create(data);
        console.log(fcm_tokens);
        await Post.findByIdAndUpdate(
          { _id: req.params.postId },
          { $push: { comments: createdData._id } },
          { new: true }
        );
        // const text = userComment.name + " " + NOTIFICATION_TEXT.COMMENT_POST;
        // if (req.body.userPostId != req.params.userCommentId) {
        //   PushNotifyController.sendNotification(text, fcm_tokens, "Thông báo");
        //   const data = new Notification({
        //     receiver: req.body.userPostId,
        //     author: req.params.userCommentId,
        //     type: "comment",
        //     text: text,
        //   });
        //   await Notification.create(data);
        // }
      }

      return res.status(200).json({ success: true, message: data });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  },
  //End region
  //Region delete Comment
  deleteComment: async (req, res) => {
    try {
      await Comment.findByIdAndUpdate(
        { _id: req.params.CommentId },
        { content: "Bình luận đã xóa" }
      );
      return res
        .status(200)
        .json({ success: true, message: "Comment deleted" });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  },
  //End region
  getAllCommentsOfAPost: async (req, res) => {
    try {
      const comments = await Comment.find({ postId: req.params.postId })
        .populate("userCommentId", "_id name avatarUrl")
        .populate("childrenComments", "_id");
      return res.status(200).json(comments);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  },
};
