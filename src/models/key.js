import mongoose from "mongoose";


const keySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
  },
});

const Key = mongoose.model("keys", keySchema, "keys");

export default Key;
