const axios = require('axios');
const fs = require('fs');

const fileBuffer = fs.readFileSync('path/to/your/cv.pdf'); // Replace with your file path

const uploadData = new FormData();
uploadData.append('cvFile', fileBuffer, 'cv.pdf');

axios.post('http://localhost:5000/analyze-cv', uploadData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
.then(response => {
  console.log("Backend Response:", response.data);
  console.log("Feedback Text:", response.data.feedback);

  // Test Parsing Logic
  const parseFeedback = (feedback) => {
    let score = null;
    let recommendations = [];
    let courses = [];
    let currentSection = '';
    let currentCourse = null;

    const lines = feedback.split('\n').map(line => line.trim());

    lines.forEach(line => {
      console.log("Current Line:", line); // Debugging: Log each line

      if (line.startsWith('**Overall Score:')) {
        currentSection = 'score';
      } else if (line.startsWith('**Recommendations to Improve the CV:')) {
        currentSection = 'recommendations';
      } else if (line.startsWith('**Course Suggestions:')) {
        currentSection = 'courses';
      } else if (currentSection === 'score') {
        const scoreMatch = line.match(/\*\*Overall Score:\s*(\d+)%\*\*/);
        if (scoreMatch) {
          score = parseInt(scoreMatch[1], 10);
        }
        currentSection = ''; // Reset section after parsing score
      } else if (currentSection === 'recommendations' && line.startsWith('*')) {
        const recMatch = line.match(/\*\s*\*\*(.*?)\*\*:\s*(.*)/);
        if (recMatch) {
          recommendations.push(`${recMatch[1]}: ${recMatch[2]}`);
        }
      } else if (currentSection === 'courses') {
        if (line.startsWith('*')) {
          if (currentCourse) {
            courses.push(currentCourse);
          }
          const courseMatch = line.match(/\*\s*\*\*(.*?)\*\*\s*\((.*?)\)\s*(.*)/);
          if (courseMatch) {
            currentCourse = {
              title: courseMatch[1].trim(),
              platform: courseMatch[2].trim(),
              description: courseMatch[3].trim(),
              youtubeTitle: '',
              youtubeLink: '',
            };
          }
        } else if (currentCourse) {
          // Handle multi-line descriptions and additional details
          if (line.startsWith('**YouTube Link:')) {
            const youtubeMatch = line.match(/\*\*\s*YouTube Link:\s*\[(.*?)\]\((.*?)\)/);
            if (youtubeMatch) {
              currentCourse.youtubeTitle = youtubeMatch[1].trim();
              currentCourse.youtubeLink = youtubeMatch[2].trim();
            }
          } else {
            // Accumulate remaining description lines
            currentCourse.description += ` ${line}`;
          }
        }
      }
    });

    // Push the last course if it exists
    if (currentCourse) {
      courses.push(currentCourse);
    }

    // Debugging: Log each section after parsing
    console.log("Parsed Score:", score);
    console.log("Parsed Recommendations:", recommendations);
    console.log("Parsed Courses:", courses);

    return { score, recommendations, courses };
  };

  const { score, recommendations, courses } = parseFeedback(response.data.feedback);

  console.log("Final Parsed Data:", { score, recommendations, courses });
})
.catch(error => {
  console.error("Error during CV analysis:", error.response?.data || error.message);
});