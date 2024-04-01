import mongoose from "mongoose";
import Post from "../models/post.js";
import cloudinary from "../utils/cloudinary.js";
import User from "../models/user.js";
import { HandleRequestData } from "../utils/handle_request_data.js";
import moment from "moment";
import { HandleResponse } from "../utils/handle_response.js";
import PendingApproval from "../models/pending_approval.js";
import Key from "../models/key.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
const PERIOD_RESET_KEY = 60 * 1000; // 1 minus  = 60 seconds = 60 * 1000 miliseconds

function getMonth(monthStr) {
  const months = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
  };
  return months[monthStr];
}

function formatTimeDifference(jsonTime) {
  let gmt1 = jsonTime.substring(29, 31);
  let gmt2 = jsonTime.substring(31, 33);
  let math = jsonTime.substring(28, 29);
  let month = getMonth(jsonTime.substring(4, 7));
  let day = jsonTime.substring(8, 10);
  let year = jsonTime.substring(11, 15);
  let hour = jsonTime.substring(16, 18);
  let minute = jsonTime.substring(19, 21);
  let second = jsonTime.substring(22, 24);
  let time = `${year}-${month}-${day}T${hour}:${minute}:${second}`;

  let postTime = moment.utc(time);

  let offsetHours =
    math === "+" ? 7 - parseInt(gmt1, 10) : 7 + parseInt(gmt1, 10);
  let offsetMinutes = parseInt(gmt2, 10);

  if (offsetMinutes === 30) {
    postTime =
      offsetHours >= 0
        ? postTime.add(offsetMinutes, "minutes")
        : postTime.subtract(offsetMinutes, "minutes");
  }

  postTime = postTime.add(offsetHours, "hours");
  return postTime.toISOString();
}
async function fetchImageFromURL(imageURL) {
  try {
    const imageResponse = await fetch(imageURL);
    if (!imageResponse.ok) {
      throw new Error(
        "Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}"
      );
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    return Buffer.from(imageBuffer);
  } catch (error) {
    console.error("Error fetching image:", error.message);
    throw error;
  }
}
function bufferToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType,
    },
  };
}
const processPendingApprovalPost = async (postId = null) => {
  try {
    console.log("====================================");
    console.log("Go in");
    console.log(postId);
    console.log("====================================");
    let pendingPosts;
    if (postId) {
      console.log("====================================");
      console.log("Yes");
      console.log(postId);
      console.log("====================================");
      pendingPosts = await PendingApproval.find({ postId });
    } else {
      console.log("====================================");
      console.log("No");
      console.log("====================================");
      pendingPosts = await PendingApproval.find();
    }
    console.log("NEXT STEP");
    console.log("Pending posts: " + pendingPosts);

    for (const pendingPost of pendingPosts) {
      const postId = pendingPost.postId;

      const post = await Post.findById(postId);
      const key = await getKey();
      const genAI = new GoogleGenerativeAI(key);

      const imageModel = genAI.getGenerativeModel({
        model: "gemini-pro-vision",
      });
      const textModel = genAI.getGenerativeModel({
        model: "gemini-pro",
      });

      const imagePrompt =
        'Please determine if the image contains any sensitive content, such as violence, nudity, or graphic images. Consider factors such as setting, theme, and visual elements. If so, return only one word "true", otherwise return only one word "false"';
      const contentPrompt =
        'Please determine if the content contains any sensitive content, such as violence, nudity, or graphic images. Consider factors such as setting, theme, and visual elements. If so, return only one word "true", otherwise return only one word "false"';
      let isPostSafe = true;
      const imageParts = [];
      for (const imageURL of post.images) {
        try {
          console.log("====================================");
          console.log("Image: " + imageURL);
          console.log("====================================");
          const imageBuffer = await fetchImageFromURL(imageURL);
          const imagePart = bufferToGenerativePart(imageBuffer, "image/png");
          imageParts.push(imagePart);
        } catch (error) {
          console.error("Error fetching image:", error);
          isPostSafe = false;
        }
      }
      try {
        console.log("All images: " + imageParts.join(" "));
        const result = await imageModel.generateContent([
          imagePrompt,
          ...imageParts,
        ]);
        const response = result.response;
        const text = response.text();
        if (text.trim() === "true") {
          isPostSafe = false;
          break;
        }
      } catch (error) {
        console.error("Error processing image:", error);
        isPostSafe = false;
      }
      try {
        console.log("====================================");
        console.log("Content: " + post.content);
        console.log("====================================");
        const result = await textModel.generateContent([
          contentPrompt,
          post.content,
        ]);
        const response = result.response;
        const text = response.text();

        if (text.trim() === "true") {
          isPostSafe = false;
        }
      } catch (error) {
        console.error("Error processing content:", error);
        isPostSafe = false;
      }
      try {
        console.log("====================================");
        console.log("Title: " + post.title);
        console.log("====================================");
        const result = await textModel.generateContent([
          contentPrompt,
          post.title,
        ]);
        const response = result.response;
        const text = response.text();

        if (text.trim() === "true") {
          isPostSafe = false;
        }
      } catch (error) {
        console.error("Error processing title:", error);
        isPostSafe = false;
      }
      post.status = isPostSafe ? "approved" : "rejected";
      await post.save();

      const text = isPostSafe
        ? "Your post has been approved."
        : "Your post has been rejected due to sensitive content.";
      const author = await User.findById(post.author);

      await PendingApproval.findByIdAndDelete(pendingPost._id);
      console.log("====================================");
      console.log(text);
      console.log("====================================");
    }
  } catch (error) {
    console.error("Error processing pending approval posts:", error);
  }
};

const getKey = async () => {
  try {
    const key = await Key.aggregate([{ $sample: { size: 1 } }]);
    console.log(key);
    return key;
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving random key",
    });
  }
};

export const PostController = {
  //Region create free post
  createPost: async (req, res) => {
    const session = await mongoose.connection.startSession();
    session.startTransaction();

    try {
      const opts = { session, returnOriginal: false };

      let data = {
        author: req.params.userId,
        title: req.body.title,
        view: req.body.view,
        content: req.body.content,
        images: req.body.images,
        postType: req.body.postType,
        emoji: req.body.emoji,
        pendingApproval: true,
        postingTime: formatTimeDifference(new Date().toString()),
        isPublic: req.body.isPublic,
      };

      let querys = [],
        functionTodo = [],
        post = {},
        user = {};

      querys.push(
        Post.create([data], null, opts)
          .then((value) => {
            if (!value) {
              throw new Error("Failed to create post");
            }
            post = value;
            console.log("value ne: " + value);
            console.log("id ne: " + value[0]._id);

            const pendingApprovalEntry = new PendingApproval({
              postId: post[0]._id,
            });

            return pendingApprovalEntry.save();
          })
          .catch((error) => {
            console.error("Error creating post:", error);
          })
      );

      await Promise.all(querys);

      functionTodo.forEach((item) => {
        item;
      });

      await HandleResponse.clientSuccess(
        res,
        "Create post successfully",
        {
          post: post[0],
        },
        null,
        session
      );
      processPendingApprovalPost(post[0]._id);
    } catch (error) {
      console.log(error);
      await HandleResponse.serverError(res, session);
    }
  },
  //End region

  //Region update
  updatePost: async (req, res) => {
    const { postId } = req.params;
    const { title, content, view, isDelete, deleteTime, isPublic } = req.body;

    try {
      let post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (isDelete) post.isDelete = isDelete;
      if (title) post.title = title;
      if (view) post.view = view;
      if (content) post.content = content;
      if (deleteTime) post.deleteTime = deleteTime;
      if (isPublic) post.isPublic = isPublic;
      await post.save();

      res.status(200).json(post);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
  //End region
  //Region delete post
  deletePost: async (req, res) => {
    try {
      const postId = req.params.postId;
      const deletedPost = await Post.findByIdAndDelete(postId);

      if (!deletedPost) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Delete images from Cloudinary
      for (const imageId of deletedPost.images) {
        await cloudinary.uploader.destroy(imageId);
      }

      res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
  //End region
  //Region get one post by Id
  getPostById: async (req, res) => {
    const { postId } = req.params;
    try {
      const post = await Post.findById(postId)
        .populate("author")
        .populate("images")
        .populate("likeAllUserId");

      res.status(200).json(post);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
  //End region
  //Region get all post
  //   getAllPost: async (req, res) => {
  //     try {
  //       const posts = await Post.find({ status: "approved" })
  //         .populate("author")
  //         .populate("images")
  //         .populate("likeAllUserId");
  //       res.status(200).json(posts);
  //     } catch (error) {
  //       res.status(400).json({ message: error.message });
  //     }
  //   },
  //End region

  //Region get all post Free
  getAllPost: async (req, res) => {
    try {
      const { userId } = req.params;

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const skip = (page - 1) * limit;
      let titles = req.query.titles;

      let filter = {
        isDelete: false,
        status: "approved",
      };

      if (titles != null && titles != undefined) {
        titles = titles.split(";");
      }
      if (titles != null && titles != undefined) {
        const regexPattern = titles.map((keyword) => `(${keyword})`).join("|");
        const regex = new RegExp(regexPattern, "i");
        filter.title = regex;
      }
      if (userId != "null") {
        const currentUser = await User.findById(userId);
        const blockedUserIds = currentUser.blockAllUserId.map((user) =>
          user._id.toString()
        );
        filter["author"] = { $nin: blockedUserIds };
      }
      const posts = await Post.find(filter)
        .sort({ postingTime: -1 })
        .populate("author")
        .populate("images")
        .populate("likeAllUserId")
        .limit(parseInt(limit))
        .skip(parseInt(skip));
      posts.forEach((post) => {
        post.isLike = post.likeAllUserId
          .map((id) => id.toString())
          .includes(userId);
      });
      if (userId != "null") {
        const user = await User.findById(userId).populate("bookmarks");

        posts.forEach((post) => {
          post.isBookmark = user.bookmarks
            .map((bookmark) => bookmark.postId.toString())
            .includes(post._id.toString());
        });
      }

      res.status(200).json(posts);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
  //End region
  //Region get all other post
  getAllOtherPost: async (req, res) => {
    const authorId = req.params.userId;
    try {
      const otherPosts = await Post.find({
        author: { $ne: authorId },
        status: "approved",
      })
        .populate("author", "-password")
        .populate("images", "-__v")
        .populate("likeAllUserId");
      otherPosts.forEach((post) => {
        post.isLike = post.likeAllUserId.includes(authorId);
      });
      res.status(200).json(otherPosts);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
  //End region

  getAllPostsOfUser: async (req, res) => {
    const authorId = req.params.userId;
    try {
      const posts = await Post.find(
        { author: authorId },
        { isDelete: false },
        { status: "approved" }
      )
        .populate("author")
        .populate("images")
        .populate("likeAllUserId");
      posts.forEach((post) => {
        post.isLike = post.likeAllUserId.includes(authorId);
      });
      res.status(200).json(posts);
    } catch (error) {
      res.status(400).json({ sucess: false, message: error.message });
    }
  },

  getAllPostsDelete: async (req, res) => {
    const authorId = req.params.userId;
    try {
      const posts = await Post.find({
        author: authorId,
        isDelete: true,
        status: "approved",
      })
        .populate("author")
        .populate("images")
        .populate("likeAllUserId");
      posts.forEach((post) => {
        post.isLike = post.likeAllUserId.includes(authorId);
      });
      res.status(200).json(posts);
    } catch (error) {
      res.status(400).json({ sucess: false, message: error.message });
    }
  },

  suggestText: async (req, res) => {
    try {
      let {
        keyword,
        page,
        pageSize,
        minPrice,
        maxPrice,
        adviseType,
        postType,
        titles,
      } = HandleRequestData.change(req.query);

      let query = [];

      if (titles != null && titles != undefined) {
        titles = titles.split(";");
      }

      if (adviseType != null && adviseType != undefined) {
        adviseType = adviseType.split(";");
      }

      let conditions = [{ isDelete: false }];

      // get lastest post
      query.push({ $sort: { createdAt: -1 } });

      if (minPrice != null && minPrice != undefined) {
        conditions.push({ price: { $gt: Number(minPrice) } });
      }
      if (maxPrice != null && maxPrice != undefined) {
        conditions.push({ price: { $lt: Number(maxPrice) } });
      }
      if (postType != null && postType != undefined) {
        conditions.push({ postType: postType });
      }
      if (adviseType != null && adviseType != undefined) {
        conditions.push({ adviseType: { $in: adviseType } });
      }
      if (titles != null && titles != undefined) {
        const regexPattern = titles.map((keyword) => `(${keyword})`).join("|");
        const regex = new RegExp(regexPattern, "i");
        conditions.push({ title: regex });
      }

      const filter = {
        $match: {
          $and: conditions,
        },
      };

      if (conditions.length > 0) {
        query.push(filter);
      }

      const joinTable = [
        {
          $lookup: {
            from: "user",
            let: { id: "$author" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", { $toObjectId: "$$id" }] } } },
              { $project: { name: 1, _id: 0, avatarUrl: 1 } },
            ],
            as: "author",
          },
        },
      ];

      let serchValue = {};

      if (keyword != null && keyword != undefined) {
        serchValue = {
          $and: [
            {
              isDelete: false,
            },
            {
              $or: [
                {
                  title: {
                    $regex: `${keyword}`,
                    $options: "i",
                  },
                },
                {
                  "author.name": {
                    $regex: `${keyword}`,
                    $options: "i",
                  },
                },
              ],
            },
          ],
        };
      }

      const filterSearch = {
        $match: serchValue,
      };

      query = [...query, ...joinTable];

      // make array to 1
      query.push({ $unwind: "$author" });

      if (Object.keys(serchValue).length) query.push(filterSearch);

      let skipNum;
      if (page != null && page != undefined) {
        skipNum = Number(page - 1) * Number(pageSize);
        if (skipNum < 0) skipNum = 0;
      }
      query.push({ $skip: Number(skipNum) });
      if (pageSize != null && pageSize != undefined)
        query.push({ $limit: Number(pageSize) });

      query.push({
        $project: {
          _id: 0,
          postId: "$_id",
          title: 1,
          author_name: "$author.name",
          author_avatarUrl: "$author.avatarUrl",
          postType: 1,
        },
      });

      let result = await Post.aggregate(query);

      res
        .status(200)
        .json({ sucess: true, total: result.length, data: result });
    } catch (error) {
      console.log(error);
      res.status(400).json({ sucess: false, message: "Server Internal Error" });
    }
  },
};
