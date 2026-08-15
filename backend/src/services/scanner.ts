import fs from "fs";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "../env";
import { HttpError } from "../middleware/error";

export interface Diagnosis {
  isHealthy: boolean;
  diagnosis: string;
  confidence: number;
  severity: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  symptoms: string;
  treatment: string;
  notes: string;
}

const DIAGNOSIS_SCHEMA = {
  type: "object",
  properties: {
    isHealthy: { type: "boolean", description: "True if no disease or pest damage is visible" },
    diagnosis: {
      type: "string",
      description: "Name of the disease/pest/deficiency found, or \"Healthy\" if none",
    },
    confidence: { type: "number", description: "Confidence from 0 to 1" },
    severity: { type: "string", enum: ["NONE", "LOW", "MEDIUM", "HIGH"] },
    symptoms: { type: "string", description: "Visible symptoms observed in the image" },
    treatment: {
      type: "string",
      description: "Concrete, actionable treatment or prevention steps a farmer can take",
    },
    notes: { type: "string", description: "Any caveats, e.g. image quality, or advice to consult an expert" },
  },
  required: ["isHealthy", "diagnosis", "confidence", "severity", "symptoms", "treatment", "notes"],
  additionalProperties: false,
} as const;

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!env.anthropicApiKey) {
    throw new HttpError(
      503,
      "The AI disease scanner isn't configured yet. Set ANTHROPIC_API_KEY in backend/.env to enable it."
    );
  }
  if (!client) client = new Anthropic({ apiKey: env.anthropicApiKey });
  return client;
}

export async function diagnoseCropImage(
  imagePath: string,
  mimeType: string,
  cropType?: string
): Promise<Diagnosis> {
  const anthropic = getClient();
  const imageBase64 = fs.readFileSync(imagePath).toString("base64");

  const response = await anthropic.messages.create({
    model: "claude-opus-5",
    max_tokens: 1024,
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: DIAGNOSIS_SCHEMA },
    },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mimeType as "image/jpeg", data: imageBase64 },
          },
          {
            type: "text",
            text: `You are an agricultural plant pathologist. Examine this photo of a${
              cropType ? ` ${cropType}` : ""
            } crop/plant and identify any disease, pest damage, or nutrient deficiency visible. Give practical, actionable treatment advice suited to a smallholder farmer.`,
          },
        ],
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new HttpError(422, "The AI declined to analyze this image. Try a clearer, well-lit photo.");
  }

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!textBlock) throw new HttpError(502, "The AI scanner returned an unexpected response.");

  return JSON.parse(textBlock.text) as Diagnosis;
}
