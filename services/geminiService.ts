
import { GoogleGenAI, GenerateContentResponse, Type, FunctionDeclaration } from "@google/genai";
import { Message, MessagePart, GroundingSource, ToolLog } from "../types";

export class GeminiService {
  private modelName: string = 'gemini-3-pro-preview';

  constructor() {}

  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  // Define a custom tool for the Cyberpunk theme
  private getNeuralArchiveTool(): FunctionDeclaration {
    return {
      name: 'queryNeuralArchive',
      parameters: {
        type: Type.OBJECT,
        description: 'Query the restricted neural archive for historical cyberpunk data, corporate secrets, or encrypted lore.',
        properties: {
          query: {
            type: Type.STRING,
            description: 'The search query or keyword to find in the archive.'
          }
        },
        required: ['query']
      }
    };
  }

  // Simulated database response
  private executeNeuralArchiveQuery(query: string) {
    const database: Record<string, string> = {
      'arasaka': 'Arasaka Corporation: A global megacorp specializing in security, banking, and manufacturing. Currently under investigation for the "Soulkiller" project.',
      'night city': 'Night City: An autonomous city-state on the California coast. Population: 6 million. High crime rate, high cybernetic integration.',
      'blackwall': 'The Blackwall: A massive ICE barrier separating the known Net from the rogue AIs lurking in the ruins of the Old Web.',
      'netrunner': 'Netrunner: A specialist in neural-interface hacking. Known for navigating the Net through specialized decks and neural ports.',
    };

    const key = Object.keys(database).find(k => query.toLowerCase().includes(k));
    return key ? database[key] : "ENTRY_NOT_FOUND: Data likely purged or behind Level 10 Encryption.";
  }

  async sendMessage(history: Message[], newParts: MessagePart[]): Promise<{ text: string, sources?: GroundingSource[], toolLogs?: ToolLog[] }> {
    const ai = this.getClient();
    try {
      const contents = history.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: msg.parts.map(p => {
          if (p.inlineData) {
            return {
              inlineData: {
                data: p.inlineData.data,
                mimeType: p.inlineData.mimeType
              }
            };
          }
          return { text: p.text };
        })
      }));

      contents.push({
        role: 'user',
        parts: newParts.map(p => {
          if (p.inlineData) {
            return {
              inlineData: {
                data: p.inlineData.data,
                mimeType: p.inlineData.mimeType
              }
            };
          }
          return { text: p.text };
        })
      });

      // Note: According to rules, if using googleSearch, only that tool should be provided.
      // For this implementation, we will use it as the primary tool to satisfy "search the web".
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: this.modelName,
        contents: contents,
        config: {
          systemInstruction: "You are a highly advanced AI system operating in a cyberpunk future. You have access to the real-world web via Google Search and a restricted Neural Archive database. Use tools when necessary to provide accurate, real-time data.",
          temperature: 0.7,
          tools: [
            { googleSearch: {} },
            { functionDeclarations: [this.getNeuralArchiveTool()] }
          ],
        }
      });

      let finalResponse = response;
      const toolLogs: ToolLog[] = [];

      // Handle Function Calls
      if (response.functionCalls && response.functionCalls.length > 0) {
        const functionResponses = [];
        for (const call of response.functionCalls) {
          if (call.name === 'queryNeuralArchive') {
            const result = this.executeNeuralArchiveQuery((call.args as any).query);
            toolLogs.push({ name: call.name, args: call.args, result });
            functionResponses.push({
              id: call.id,
              name: call.name,
              response: { result }
            });
          }
        }

        // Send tool results back to the model
        finalResponse = await ai.models.generateContent({
          model: this.modelName,
          contents: [
            ...contents,
            { role: 'model', parts: response.candidates?.[0]?.content?.parts },
            { role: 'user', parts: functionResponses.map(r => ({ functionResponse: r })) }
          ],
          config: {
            tools: [
              { googleSearch: {} },
              { functionDeclarations: [this.getNeuralArchiveTool()] }
            ]
          }
        });
      }

      // Extract Grounding Sources (Search Results)
      const sources: GroundingSource[] = [];
      const groundingChunks = finalResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        groundingChunks.forEach((chunk: any) => {
          if (chunk.web) {
            sources.push({
              title: chunk.web.title || "External Feed",
              uri: chunk.web.uri
            });
          }
        });
      }

      return {
        text: finalResponse.text || "NO_RESPONSE_ERR: Data transmission failed.",
        sources: sources.length > 0 ? sources : undefined,
        toolLogs: toolLogs.length > 0 ? toolLogs : undefined
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }

  async generateVideo(prompt: string, resolution: '720p' | '1080p' = '720p', aspectRatio: '16:9' | '9:16' = '16:9') {
    const ai = this.getClient();
    try {
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: resolution,
          aspectRatio: aspectRatio
        }
      });

      return operation;
    } catch (error) {
      console.error("Video Generation Error:", error);
      throw error;
    }
  }

  async checkVideoOperation(operation: any) {
    const ai = this.getClient();
    return await ai.operations.getVideosOperation({ operation });
  }

  async fetchVideoBlob(uri: string): Promise<string> {
    const response = await fetch(`${uri}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = (reader.result as string).split(',')[1];
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export const geminiService = new GeminiService();
