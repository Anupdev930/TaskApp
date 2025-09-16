
import { GoogleGenAI } from "@google/genai";

// IMPORTANT: API key is read from environment variables for security.
// Do not hardcode the API key in the code.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.warn("Gemini API key not found. AI features will be disabled. Make sure to set the process.env.API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const generateTaskDescription = async (title: string): Promise<string> => {
    if (!API_KEY) {
        return Promise.resolve("AI features are disabled. Please configure the API key.");
    }

    try {
        const prompt = `Based on the task title "${title}", generate a concise and professional task description. The description should be a single paragraph, suitable for a project management tool. Do not use markdown or any special formatting.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 0 } // For faster response
            }
        });

        return response.text;
    } catch (error) {
        console.error("Error generating task description with Gemini:", error);
        return "An error occurred while generating the description.";
    }
};
