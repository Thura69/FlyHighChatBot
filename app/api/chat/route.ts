import { openai } from "@ai-sdk/openai";
import { streamText, convertToCoreMessages, tool } from "ai";
import { z } from "zod";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai("gpt-4-turbo"),
    messages: convertToCoreMessages(messages),
    tools: {
      weather: tool({
        description: "Get the weather in a location (Fahrenheit)",
        parameters: z.object({
          location: z.string().describe("The location to get the weather for"),
        }),
        execute: async ({ location }) => {
          const temperature = Math.round(Math.random() * (90 - 32) + 32);
          return {
            location,
            temperature,
          };
        },
      }),

      productInfo: tool({
        description: "Tell me product information from the store API",
        parameters: z.object({
          productId: z
            .string()
            .optional()
            .describe(
              "The ID of the product to retrieve information for (optional)."
            ),
        }),
        execute: async ({ productId }) => {
          const url = productId
            ? `https://fakestoreapi.com/products/${productId}`
            : "https://fakestoreapi.com/products";

          const response = await fetch(url);
          const data = await response.json();

          if (productId) {
            return {
              product: {
                title: data.title,
                description: data.description,
                price: data.price,
              },
            };
          } else {
            return {
              products: data.map((product: any) => ({
                title: product.title,
                description: product.description,
                price: product.price,
              })),
            };
          }
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}
