import dotenv from "dotenv";
dotenv.config();
import Groq from "groq-sdk";

const groq=new Groq({
  apiKey: process.env.GROQ_API_KEY
})

const analyzeError=async(errorText)=>{
  try {
    const response=await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages:[
        {
          role:"system",
          content: `You are an expert debugging assistant. 
          Respond ONLY in JSON with keys "cause" and "fix".`,        
        },
        {
          role:"user",
          content: `Analyze this error:\n${errorText}`,
        },
      ],
      response_format: { type: "json_object" }
    });

    const raw = response.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {
        cause: "Parsing failed",
        fix: raw,
      };
    }

    return parsed;   
  } catch (error) {
    console.error("Groq error:", error.message);
    throw error;   
  }
}

export default analyzeError;