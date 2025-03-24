const feedback = `
**Overall Score:** 80%

**Recommendations to Improve the CV:**

* **Format and Design:** Consider using a more visually appealing and modern design template to enhance the readability and professional appearance of the CV.
* **Highlight Quantifiable Results:** Quantify your accomplishments with specific metrics to demonstrate the impact of your contributions, such as percentages, numbers, or dollar values.
* **Tailor to Specific Roles:** Customize your CV to align with the requirements of each job you apply for, highlighting relevant skills, experience, and projects.
* **Proofread Carefully:** Ensure there are no errors in spelling, grammar, or punctuation.
* **Consider Adding a Portfolio Section:** Include a link to an online portfolio showcasing your work and projects.

**Course Suggestions:**

* **React Fundamentals:** (Udemy) Learn the core concepts and best practices of React, a popular JavaScript framework for building dynamic web applications.
    * **YouTube Link:** [https://www.youtube.com/watch?v=sBws8MSXN7A](https://www.youtube.com/watch?v=sBws8MSXN7A)
* **Full-Stack JavaScript Mastery:** (Coursera) Develop a comprehensive understanding of JavaScript, including front-end and back-end programming.
    * **YouTube Link:** [https://www.youtube.com/watch?v=pKd0Rpw7Mik](https://www.youtube.com/watch?v=pKd0Rpw7Mik)
* **Agile for Developers:** (edX) Understand the Agile methodologies and practices used in software development for effective team collaboration.
    * **YouTube Link:** [https://www.youtube.com/watch?v=hG7ei4s24pU](https://www.youtube.com/watch?v=hG7ei4s24pU)
`;

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

const { score, recommendations, courses } = parseFeedback(feedback);

console.log("Final Parsed Data:", { score, recommendations, courses });