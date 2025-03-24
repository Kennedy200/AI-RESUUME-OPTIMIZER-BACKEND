const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: 'https://career-boost-1.vercel.app' })); // Allow requests from your Vercel domain
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

app.post("/analyze-cv", upload.single("cvFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const fileBuffer = req.file.buffer;
    let extractedText = "";
    let isPDF = req.file.mimetype === "application/pdf";
    let under2MB = req.file.size <= 2 * 1024 * 1024; // 2MB limit

    if (isPDF) {
      try {
        const pdfData = await pdfParse(fileBuffer);
        extractedText = pdfData.text;
      } catch (pdfError) {
        console.error("Error parsing PDF:", pdfError);
        return res.status(400).json({ error: "Error with PDF File" });
      }
    } else if (req.file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      extractedText = result.value;
    } else {
      return res.status(400).json({ error: "Unsupported file format" });
    }

    // **Strict AI Prompt for JSON Output**
    const prompt = `
You are an AI specializing in resume analysis. Analyze the following CV and return a structured JSON response. 

⚠️ IMPORTANT: The response **MUST** be valid JSON. Ensure all characters are properly escaped.

CV TEXT:
${extractedText}

Format the response as follows:

{
  "overallScore": 85,
  "sections": {
    "contentFormatting": "Clear and well-structured.",
    "keySkills": {
      "hardSkills": ["React", "Next.js", "TypeScript"],
      "softSkills": ["Communication", "Problem-solving"],
      "missingSkills": ["GraphQL", "Redux"]
    },
    "atsOptimization": "Good ATS compatibility.",
    "jobAlignment": 90,
    "spellingGrammar": "No errors found.",
    "fileSizeFormat": {
      "File under 2MB size": "Yes",
      "File in a PDF format": "Yes"
    },
    "repetitionCheck": {
      "repeatedWords": ["team", "leadership"],
      "suggestions": ["Use synonyms for 'team'"]
    },
    "resumeLength": {
      "wordCount": 450,
      "status": "Good"
    },
    "designTemplate": "Professional layout.",
    "contactInfo": {
      "hasEmail": "Yes",
      "hasContactInfo": "Yes"
    },
    "activeVoice": "80%",
    "buzzwords": {
      "found": ["innovative", "synergy"],
      "suggestions": ["Use simpler alternatives"]
    }
  },
  "recommendations": ["Add a summary section.", "Include more measurable achievements."],
  "courseSuggestions": [
    {
      "title": "Advanced React Patterns",
      "platform": "Udemy",
      "description": "Master advanced React concepts.",
      "url": "https://udemy.com/react-patterns"
    }
  ]
}
`;

    const result = await model.generateContent(prompt);
    let responseText = await result.response.text();

    console.log("[DEBUG] Raw AI Response:", responseText); // Log raw AI response

    // **Extract Only JSON - Removes Markdown Formatting (if any)**
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in AI response.");
    }
    responseText = jsonMatch[0];

    // **Fix Invalid Characters (e.g., unescaped quotes, bad newlines)**
    responseText = responseText.replace(/[\u0000-\u001F]+/g, " "); // Remove control characters
    responseText = responseText.replace(/\r?\n|\r/g, " "); // Remove newlines inside strings

    let feedback;
    try {
      feedback = JSON.parse(responseText);
    } catch (parseError) {
      console.error("[ERROR] Failed to parse AI response:", parseError);
      return res.status(500).json({ error: "AI response could not be parsed. Check backend logs." });
    }

    // **Ensure All Fields Exist with Default Values**
    feedback.sections = feedback.sections || {};

    feedback.sections.repetitionCheck = feedback.sections.repetitionCheck || {};
    feedback.sections.repetitionCheck.repeatedWords = feedback.sections.repetitionCheck.repeatedWords?.length
      ? feedback.sections.repetitionCheck.repeatedWords
      : ["No repeated words detected"];
    feedback.sections.repetitionCheck.suggestions = feedback.sections.repetitionCheck.suggestions?.length
      ? feedback.sections.repetitionCheck.suggestions
      : ["No suggestions available"];

    feedback.sections.buzzwords = feedback.sections.buzzwords || {};
    feedback.sections.buzzwords.found = feedback.sections.buzzwords.found?.length
      ? feedback.sections.buzzwords.found
      : ["No buzzwords detected"];
    feedback.sections.buzzwords.suggestions = feedback.sections.buzzwords.suggestions?.length
      ? feedback.sections.buzzwords.suggestions
      : ["No alternative suggestions available"];

    console.log("[DEBUG] Final Processed Feedback:", feedback); // Log final output

    res.status(200).json(feedback);
  } catch (error) {
    console.error("[ERROR] CV Analysis Failed:", error);
    res.status(500).json({ error: "An error occurred during CV analysis." });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
