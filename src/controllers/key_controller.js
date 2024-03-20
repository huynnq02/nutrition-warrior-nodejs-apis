import Key from "../models/key.js";

export const KeyController = {
  // Get all keys
  getAllKeys: async (req, res) => {
    try {
      const keys = await Key.find();
      res.status(200).json({
        success: true,
        keys: keys,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error retrieving keys",
      });
    }
  },

  // Add a new key
  addKey: async (req, res) => {
    try {
      const { key } = req.body;
      const newKey = new Key({ key });
      await newKey.save();
      res.status(201).json({
        success: true,
        message: "Key added successfully",
        key: newKey,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error,
      });
    }
  },

  // Delete a key
  deleteKey: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedKey = await Key.findByIdAndDelete(id);
      if (!deletedKey) {
        return res.status(404).json({
          success: false,
          message: "Key not found",
        });
      }
      res.status(200).json({
        success: true,
        message: "Key deleted successfully",
        key: deletedKey,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error deleting key",
      });
    }
  },

  // Get a random key
  getRandomKey: async (req, res) => {
    try {
      const key = await Key.aggregate([{ $sample: { size: 1 } }]);
      res.status(200).json({
        success: true,
        key: key[0],
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error retrieving random key",
      });
    }
  },
};
