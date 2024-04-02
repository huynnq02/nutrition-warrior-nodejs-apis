import Like from "../models/like.js";
import User from "../models/user.js";
import Post from "../models/post.js";
export const LikeController = {
  //Region create Like
  addLike: async (req, res) => {
    const data = new Like({
      postId: req.params.postId,
      userLikeId: req.params.userLikeId,
      time: req.body.time,
    });
    try {
      const createdData = await Like.create(data);
      const userLikeId = await User.findById(req.params.userLikeId);
      const postId = await Post.findById(req.params.postId);
      const userPostId = await User.findById(postId.author);
      let text = "";
      if (postId.likeCounts == 0) {
        text = userLikeId.name + " đã thích bài đăng của bạn";
      } else {
        text =
          userLikeId.name +
          " và " +
          postId.likeCounts +
          " người khác đã thích bài đăng của bạn";
      }
      //   const fcm_tokens = userPostId.fcm_tokens;
      //   if (!userLikeId._id.equals(userPostId._id)) {
      //     PushNotifyController.sendNotification(text, fcm_tokens, "Thông báo");
      //     const data = new Notification({
      //       receiver: userPostId._id,
      //       author: userLikeId._id,
      //       type: "like",
      //       text: text,
      //     });
      //     await Notification.create(data);
      //   }

      await Post.findByIdAndUpdate(
        { _id: req.params.postId },
        { $inc: { likeCounts: 1 }, $push: { likeAllUserId: data.userLikeId } },
        { new: true }
      );
      return res.status(200).json({ success: true, message: data });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  },
  //End region
  // Region delete Like
  deleteLike: async (req, res) => {
    const { postId, userLikeId } = req.params;

    try {
      await Like.findOneAndDelete({ postId, userLikeId });

      // Remove the userLikeId from the likeAllUserId array in the Post collection
      await Post.findByIdAndUpdate(
        postId,
        { $pull: { likeAllUserId: userLikeId }, $inc: { likeCounts: -1 } },
        { new: true }
      );

      return res.status(200).json({ success: true, message: "Like deleted" });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  },
  // End region
};
