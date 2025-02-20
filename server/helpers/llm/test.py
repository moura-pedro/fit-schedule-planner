import subprocess
import json


# Read transcript text
with open("transcript.txt", "r", encoding="utf-8") as file:
    print("File Opened")
    transcript_text = file.read()

print("File Read")
# Define LLM prompt
prompt = """
You are a structured data extraction assistant. Your task is to parse the provided university transcript into a well-structured JSON format.

### **Instructions:**
1. **Ensure JSON Validity**: The output must be valid JSON, following the schema described below.
2. **Extract Data Accurately**: Pull details from all terms, including completed and in-progress courses.
3. **Format Data Correctly**:
   - Numbers should remain as numbers (e.g., GPA as `3.45`, credit hours as `3.0`).
   - Strings should not have extra spaces or newlines.

### **Output JSON Schema:**
```json
{
  "studentInfo": {
    "studentId": "<student_id>",
    "name": "<full_name>",
    "program": "<degree_program>",
    "college": "<college_name>",
    "major": "<major_name>"
  },
  "courses": [
    {
      "term": "<term_name>",
      "subject": "<subject_code>",
      "courseCode": "<course_number>",
      "title": "<course_title>",
      "grade": "<grade_received>",
      "creditHours": <credit_hours>,
      "qualityPoints": <quality_points>,
      "status": "completed"
    }
    // Include all completed courses
  ],
  "overallTotals": {
    "attemptHours": <total_attempt_hours>,
    "passedHours": <total_passed_hours>,
    "earnedHours": <total_earned_hours>,
    "gpaHours": <total_gpa_hours>,
    "qualityPoints": <total_quality_points>,
    "gpa": <overall_gpa>
  },
  "coursesInProgress": [
    {
      "term": "<term_name>",
      "subject": "<subject_code>",
      "courseCode": "<course_number>",
      "title": "<course_title>",
      "creditHours": <credit_hours>
    }
    // Include all in-progress courses
  ]


Transcript Data:

""" + f'{transcript_text}'
print("Prompt Wrote")
print(prompt)
# Run local LLM with Ollama
result = subprocess.run(["ollama", "run", "llama3", prompt], capture_output=True, text=True)

print()

print("Running LLM")
# Convert LLM response to JSON
try:
    structured_data = json.loads(result.stdout)
    with open("structured_transcript.json", "w", encoding="utf-8") as json_file:
        json.dump(structured_data, json_file, indent=4)
    print("Structured JSON saved successfully.")
except json.JSONDecodeError:
    print("Failed to parse JSON. Raw output:", result.stdout)
