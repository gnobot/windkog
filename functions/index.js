const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const {GoogleGenAI} = require("@google/genai");

// 1. Define the secret (does not load the value until runtime)
const geminiApiKey = defineSecret("GEMINI_API_KEY");

// 2. define the function using Gen 2 (better performance)
exports.askGemini = onCall(
    {
      secrets: [geminiApiKey], // Explicitly grant access to the key
      cors: true, // Allow calls from windkog.com
      timeoutSeconds: 60, // AI needs time to think!
      region: "us-central1",
    },
    async (request) => {
    // 3. Security Check (Ensure only your app can call this)
      if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "Only authorized WindKOG users can access the Agent.",
        );
      }

      const userPrompt = request.data.prompt;

      try {
      // 4. Initialize the Client (using the secret value)
        const client = new GoogleGenAI({apiKey: geminiApiKey.value()});

        // 5. Generate Content
        const model = client.getGenerativeModel({model: "gemini-1.5-pro"});
        const result = await model.generateContent(userPrompt);
        const response = await result.response;
        const text = response.text();

        return {success: true, answer: text};
      } catch (error) {
        console.error("Gemini Error:", error);
        throw new HttpsError("internal", "The Agent is currently unavailable.");
      }
    },
);
