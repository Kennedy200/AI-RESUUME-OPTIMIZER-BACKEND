const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 5000;

// Configure cors middleware
app.use(cors());
app.use(express.json()); // To parse JSON request bodies

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro"});

// Endpoint to analyze CV
app.post('/analyze-cv', upload.single('cvFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        const fileBuffer = req.file.buffer;
        let extractedText = '';

        if (req.file.mimetype === 'application/pdf') {
          try{
             const pdfData = await pdfParse(fileBuffer);
             extractedText = pdfData.text;
           }catch (pdfError){
               console.error("Error parsing PDF:", pdfError)
               return res.status(400).json({message: "Error with PDF File"});
          }


        } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            extractedText = result.value;
        } else {
                return res.status(400).send('Unsupported file format');
        }

         // Prompt for Gemini
       const prompt = `Analyze the following CV text and provide:
       1.  An overall score out of 100, displayed as an integer percentage.
       2. Recommendations to improve the CV.
        3. Course suggestions, including course titles, descriptions and, if available, YouTube links to help users access the course.
        \n\n${extractedText}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ feedback: text});

    } catch (error) {
        console.error('Error during CV analysis:', error);
        res.status(500).send('An error occurred during CV analysis.');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});