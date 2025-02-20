const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function parseTranscriptWithGPT(transcriptText) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a structured data extraction assistant. Your task is to parse the provided university transcript into a well-structured JSON format.

                    ### **Instructions:**
                    1. **Ensure JSON Validity**: The output must be valid JSON, following the schema described below.
                    2. **Extract Data Accurately**: Pull details from all terms, including completed and in-progress courses.
                    3. **Format Data Correctly**:
                    - Numbers should remain as numbers (e.g., GPA as "3.45", credit hours as "3.0").
                    - Strings should not have extra spaces or newlines.
                    `

                    
                            },
        {
          role: "user",
          content: `Parse this transcript into a JSON object with the following structure:
          {
            "studentInfo": {
              "studentId": string,
              "name": string,
              "program": string,
              "college": string,
              "major": string
            },
            "courses": [
              {
                "term": string,
                "subject": string,
                "courseCode": string,
                "title": string,
                "grade": string,
                "creditHours": number,
                "qualityPoints": number,
                "status": "completed" | "in-progress"
              }
            ],
            "overallTotals": {
              "attemptHours": number,
              "passedHours": number,
              "earnedHours": number,
              "gpaHours": number,
              "qualityPoints": number,
              "gpa": number
            }
          }
            

          Transcript content:
          ${transcriptText}`
        }
      ],
      temperature: 0,
      max_tokens: 4000,
      seed:123,
      response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('Error in OpenAI parsing:', error);
    console.log('Raw response:', completion.choices[0].message.content);

    throw error;
  }
}

module.exports = { parseTranscriptWithGPT };