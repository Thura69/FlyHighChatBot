import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const dataset = [
  "Geocode 13120000601, Municipality: Nerima Ward, Neighborhood: Toyotama Middle School (1), Standard Distribution Count: 1010, Designated Distribution for Apartments: 680, Designated Distribution for Houses: 290, Exclusion Distribution for Companies/Stores: 1010",
  "Geocode: 13120000602, Municipality: Nerima Ward, Neighborhood: Toyotama Middle School (2), Standard Distribution Count: 1370, Designated Distribution for Apartments: 1140, Designated Distribution for Houses: 190, Exclusion Distribution for Companies/Stores: 1370",
  "Geocode: 13120000603, Municipality: Nerima Ward, Neighborhood: Toyotama Middle School (3), Standard Distribution Count: 1360, Designated Distribution for Apartments: 1090, Designated Distribution for Houses: 240, Exclusion Distribution for Companies/Stores: 1360",
];

export async function GET(req: any, res: any) {
  try {
    const embeddings = [];

    const prompt = `Please ask the user to specify the number of copies they plan to distribute in the following format: 
    "Please tell us the number of copies you plan to distribute (e.g. 10,000 copies)"`;

    for (const item of dataset) {
      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: item,
      });

      embeddings.push({
        text: item,
        embedding: response.data[0].embedding,
      });
    }

    const dataPath = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataPath)) {
      fs.mkdirSync(dataPath);
    }

    fs.writeFileSync(
      path.join(dataPath, "embeddings.json"),
      JSON.stringify(embeddings, null, 2)
    );

    res.status(200).json({ message: "Embeddings generated successfully" });
  } catch (error: any) {
    console.error("Error generating embeddings:", error);
    res.status(500).json({ error: error.message });
  }
}
