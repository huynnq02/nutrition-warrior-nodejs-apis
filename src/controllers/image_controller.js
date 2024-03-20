import { GoogleGenerativeAI } from "@google/generative-ai";
import Key from "../models/key.js";
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
const fileToGenerativePart = (buffer, mimeType) => {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType,
    },
  };
};

export const ImageController = {
  describeAndAdvice: async (req, res) => {
    try {
      console.log("Go inside");

      if (req.file) {


        const key = await getKey();
        console.log("Key: " + key[0].key);
        const genAI = new GoogleGenerativeAI(key[0].key);
        const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
        console.log("1");

        const analyzePrompt = `**Analyze the image:**

* Identify all food items present in the image.
* For each food item:
  * Estimate the portion size.
  * Provide a general nutritional breakdown (calories, carbohydrates, protein, fat, fiber).
  * Indicate if the food is a good source of any specific vitamins or minerals.
* If the image does not  contain any food, state "The image does not contain any food items."

**Example output:**

The image shows a plate with a medium-sized grilled salmon fillet (approximately 150g), a side of roasted broccoli (approximately 1 cup), and a small bowl of brown rice (approximately 1/2 cup).

* **Salmon (150g):** Calories: 250, Protein: 30g, Fat: 12g, Carbohydrates: 0g, Fiber: 0g. Salmon is a good source of omega-3 fatty acids, vitamin D, and selenium.
* **Broccoli (1 cup):** Calories: 50, Protein: 4g, Fat: 0.5g, Carbohydrates: 10g, Fiber: 2.5g. Broccoli is a good source of vitamin C, vitamin K, and folate.
* **Brown rice (1/2 cup):** Calories: 100, Protein: 5g, Fat: 1g, Carbohydrates: 20g, Fiber: 2g. Brown rice is a good source of fiber and complex carbohydrates.

**Overall, this meal provides a good balance of protein, healthy fats, carbohydrates, and fiber. It is also a good source of omega-3 fatty acids, vitamin C, vitamin D, vitamin K, selenium, and folate.**`;
        const advicePrompt = `Based on the identified food items in the image and their nutritional content, analyze whether the meal provides a balanced and complete nutritional intake.

* If the meal is adequate, state that it provides a good balance of nutrients.
* If the meal lacks some essential vitamins or minerals, identify the missing nutrients and suggest specific food sources rich in those nutrients.

**Example output:**

This meal appears to be a well-balanced and nutritious choice. However, it might be beneficial to include a source of vitamin A, such as carrots, oranges, or leafy greens.

**Additional tips:**

* Consider adding a disclaimer that the provided information is for general informational purposes and should not substitute professional dietary advice.`;
        const imageBuffer = req.file.buffer;

        const imagePart = fileToGenerativePart(imageBuffer, "image/png");

        const [analyzeResult, adviceResult] = await Promise.all([
          model.generateContent([analyzePrompt, imagePart]),
          model.generateContent([advicePrompt, imagePart]),
        ]);

        const analyzeText = analyzeResult.response.text();
        const adviceText = adviceResult.response.text();

        return res.status(200).json({
          success: true,
          message: { analyze: analyzeText, advice: adviceText },
        });
      } else {
        console.error("Upload failed");
        res.status(500).json({ message: "Upload failed!" });
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },
};
