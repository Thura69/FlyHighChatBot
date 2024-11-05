import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is set in your .env.local
});

const embeddingsPath = path.join(process.cwd(), "data", "embeddings.json");
const embeddings = JSON.parse(fs.readFileSync(embeddingsPath, "utf-8"));

const OPENAIVALUES = [
  { name: "flyers", value: 0 },
  { name: "businessName", value: "" },
  { name: "age", value: "" },
  { name: "city", value: "" },
];

let CITYLISTS = "";

function cosineSimilarity(vec1: any, vec2: any) {
  const dotProduct = vec1.reduce(
    (sum: any, v: any, i: any) => sum + v * vec2[i],
    0
  );

  const magnitudeA = Math.sqrt(
    vec1.reduce((sum: any, v: any) => sum + v * v, 0)
  );
  const magnitudeB = Math.sqrt(
    vec2.reduce((sum: any, v: any) => sum + v * v, 0)
  );
  return dotProduct / (magnitudeA * magnitudeB);
}

export async function POST(req: any, res: any) {
  const { query, step, conversation } = await req.json();

  let ConversationStep = step;

  try {
    const queryEmbeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });
    const queryEmbedding = queryEmbeddingResponse.data[0].embedding;

    let bestMatch = null;
    let highestSimilarity = -1;

    embeddings.forEach((item: any) => {
      const similarity = cosineSimilarity(queryEmbedding, item.embedding);
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        bestMatch = item.text;
      }
    });

    let prompt = "";
    // .

    if (ConversationStep === 0) {
      prompt = `
  The value of "${query}" must adhere to the following specifications, analyzed carefully step by step:


  0. Pattern Requirement:
     The value must precisely match the format (e.g., 'x,xxx部'). It should not deviate from this structure. If value does not follow the format respond with 'false' (not 'False', just 'false').

  1. Ending Requirement:
     The value cannot consist solely of numeric characters; it must conclude with '部'. 

  2. Proper Formatting:
     The value must be a properly formatted number. It should not resemble incorrect formats like '23324,234234' and must always end with '部'.

  3. Comma-Separated Format:
     The value must be in a comma-separated thousands format (e.g., '3,000部') and must include '部' at the end of the value.

  4. Numeric Character Requirement:
     Only numeric digits are permitted before '部', and these numbers must contain commas as thousands separators.
  
  5. Prohibition of Extraneous Characters:
     Any letters, special characters, or additional symbols before '部' are strictly forbidden.

  6. Validity Check:
     The value is valid only if it equals '3,000部' or exceeds this amount.

  
  Convert the number before '部' into a plain number (without commas or separators).

  (a) If the value before '部' is equal to 3,000 or greater than 3,000.
  
  (b) Respond exactly with:
      ありがとうございます。では、今回のチラシ配布の目的を教えてください (例：新規オープンするパーソナルジムの集客案内チラシ). "{{{plain number}}}"
      where {{{plain number}}} is the converted number.

  If "${query}" does not meet any of these criteria, respond with 'false' (not 'False', just 'false').

  `;
    } else if (ConversationStep === 1) {
      prompt = `
Translate "${query}" into Japanese. If the meaning of "${query}" is not related to flyer distribution or is inappropriate for business purposes (e.g., "I want to kill the dog", "I want to steal something", "I want to poison the city", "I want to burn"), respond only exactly 'notBusiness'.

Then, respond exactly with : 
配布タイプを選択して下さい。
標準配布 ""
一軒家指定 ""
集合住宅指定 ""
会社・店舗除外配布 /{{{BusinessName}}}/


where {{{BusinessName}}} is the related to flyer distribution or is inappropriate for business name from ${query}.

Use the reference: 'ジムの集客用折込ですね'.

`;
    } else if (ConversationStep === 2) {
      prompt = `

    if the ${query} 
      
     You are a strict validator. Check if "${query}" is included in one of the cities in "
標準配布
一軒家指定
集合住宅指定
会社•店舗除外配布".

If "${query}" is not included in the list, respond exactly with 'false' (not 'False', just 'false').

If "${query}" is included in the list, response では、メインターゲットを教えてください (例：30代女性, 25代男性)

`;
    } else if (ConversationStep === 3) {
      prompt = `
 The "${query}" format must meet these exact criteria:

  1.It must contain a number between 0 and 150.
  2.The number must be followed exactly by either:
     (a) 代女性 or
     (b) 代男性

  For example: "30代女性" or "40代男性".


  If the format does not match this structure or if the number is outside the range of 0 to 150, respond exactly with 'false' (not 'False', just 'false').

  
  If the format is valid, respond with:
 "最後に集客の中心はどこを想定していますか？ //{{{ageAndGender}}}// "
 Then, List the three best places in Japan to distribute flyers for ${OPENAIVALUES[1].value} business, specifically targeting ${query}. Please provide only the names of the locations., using bullet points. 
 where {{{ageAndGender}}} is the valide value of the ${query}.
`;
    } else if (ConversationStep === 4) {
      prompt = `

   You are a strict validator. Check if "${query}" is included in one of the cities in "${CITYLISTS}".

If "${query}" is not included in the list, respond exactly with 'false' (not 'False', just 'false').

If "${query}" is included in the list, respond with a list of three areas around "${query}" where I can distribute "${OPENAIVALUES[0].value}" flyers for my "${OPENAIVALUES[1].value}" business. The main target audience is "${OPENAIVALUES[2].value}". 

Format the response strictly as follows without any additional text:

[Area Name] [Number of Flyers]部
[Area Name] [Number of Flyers]部
[Area Name] [Number of Flyers]部


    Ensure the list includes popular and relevant locations where this demographic is likely to reside or visit."
      `;
    }

    const completionResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
      max_tokens: 300,
    });

    let gptAnswer = completionResponse.choices[0].message.content;

    if (gptAnswer == "false" || gptAnswer == "notBusiness") {
      if (ConversationStep === 0) {
        ConversationStep = 0;
      }

      if (ConversationStep === 1) {
        ConversationStep = 1;
      }

      if (ConversationStep === 2) {
        ConversationStep = 2;
      }

      if (ConversationStep === 3) {
        console.log(CITYLISTS);
        ConversationStep = 3;
      }

      if (ConversationStep === 4) {
        console.log(CITYLISTS);
        ConversationStep = 4;
      }

    } else {
      if (ConversationStep === 0) {
        const inputString = gptAnswer;
        const match = inputString?.match(/"(.*?)"/);

        if (match && match[1]) {
          const valueBetweenQuotes = match[1];

          const stringWithoutValue = inputString?.replace(/"\d+"/, "");

          if (stringWithoutValue && valueBetweenQuotes) {
            OPENAIVALUES[0].value = valueBetweenQuotes;
            gptAnswer = stringWithoutValue;

            ConversationStep = 1;
          } else {
            ConversationStep = 0;
            gptAnswer = "false";
            return;
          }
        } else {
          console.log("No value found between quotes.");
        }
      } else if (ConversationStep === 1) {
        const inputString = gptAnswer;
        const match = inputString?.match(/\/(.*?)\//);

        if (match && match[1]) {
          const valueBetweenSlashes = match[1];

          const stringWithoutValue = inputString?.replace(/\/.*?\//, "");

          if (stringWithoutValue && valueBetweenSlashes) {
            OPENAIVALUES[1].value = valueBetweenSlashes; //
            gptAnswer = stringWithoutValue;

            ConversationStep = 2;
          } else {
            ConversationStep = 1;
            gptAnswer = "false";
            return;
          }
        } else {
          console.log("No value found between slashes.");
        }
      }else if(ConversationStep ===2){
        ConversationStep = 3
  
      } else if (ConversationStep === 3) {
        const inputString = gptAnswer;
        const match = inputString?.match(/\/\/(.*?)\/\//);
        if (match && match[1]) {
          const valueBetweenDoubleSlashes = match[1];

          const stringWithoutValue = inputString?.replace(/\/\/.*?\/\//, "");

          if (stringWithoutValue && valueBetweenDoubleSlashes) {
            OPENAIVALUES[2].value = valueBetweenDoubleSlashes;
            CITYLISTS = stringWithoutValue;
            gptAnswer = stringWithoutValue;

            ConversationStep = 4;
          } else {
            ConversationStep = 3;
            gptAnswer = "false";
            return;
          }
        } else {
          console.log("No value found between double slashes.");
        }
      }
    }

    return NextResponse.json(
      { answer: gptAnswer, nextStep: ConversationStep },
      { status: 200 }
    );
  } catch (error: any) {
    console.log(error);
    return NextResponse.json(
      { message: { error: error.message } },
      { status: 500 }
    );
  }
}
