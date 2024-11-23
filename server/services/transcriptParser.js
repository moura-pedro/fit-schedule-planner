// server/services/transcriptParser.js
const pdfParse = require('pdf-parse');

class TranscriptParser {
    constructor(buffer) {
        this.buffer = buffer;
    }

    async parse() {
        try {
            const pdfData = await pdfParse(this.buffer);
            const content = pdfData.text;
            
            return {
                studentInfo: this.parseStudentInfo(content),
                courses: this.parseCourses(content),
                termTotals: this.parseTermTotals(content),
                overallTotals: this.parseOverallTotals(content)
            };
        } catch (error) {
            console.error('Error parsing PDF:', error);
            throw error;
        }
    }

    parseStudentInfo(content) {
        const nameMatch = content.match(/Name\s*:\s*(.*?)(?=\n)/);
        const programMatch = content.match(/Program:\s*(.*?)(?=\n)/);
        const collegeMatch = content.match(/College:\s*(.*?)(?=\n)/);
        const majorMatch = content.match(/Major[^:]*:\s*(.*?)(?=\n)/);

        return {
            name: nameMatch ? nameMatch[1].trim() : '',
            program: programMatch ? programMatch[1].trim() : '',
            college: collegeMatch ? collegeMatch[1].trim() : '',
            major: majorMatch ? majorMatch[1].trim() : ''
        };
    }

    parseCourses(content) {
        const courses = [];
        const terms = content.split(/Term: /g);
        
        terms.slice(1).forEach(termSection => {
            const termMatch = termSection.match(/^([^\n]+)/);
            const term = termMatch ? termMatch[1].trim() : '';
            
            // Skip if this is not a valid term section
            if (!term || term.includes('TRANSCRIPT TOTALS')) return;

            // Extract course information using regex
            const coursePattern = /(\w+)\s+(\d+)\s+(\d+)\s+([^\n]+?)\s+([A-Z][+-]?|W|P)\s+(\d+\.\d+)\s+(\d+\.\d+)?/g;
            let match;

            while ((match = coursePattern.exec(termSection)) !== null) {
                courses.push({
                    term,
                    subject: match[1],
                    courseCode: match[2],
                    level: match[3],
                    title: match[4].trim(),
                    grade: match[5],
                    creditHours: parseFloat(match[6]),
                    qualityPoints: match[7] ? parseFloat(match[7]) : null,
                    status: 'completed'
                });
            }
        });

        // Parse courses in progress
        const inProgressMatch = content.match(/COURSES IN PROGRESS[\s\S]*?Term: ([^\n]+)([\s\S]*?)(?=\n\n|$)/);
        if (inProgressMatch) {
            const inProgressTerm = inProgressMatch[1];
            const inProgressSection = inProgressMatch[2];
            const inProgressPattern = /(\w+)\s+(\d+)\s+(\d+)\s+([^\n]+?)\s+(\d+\.\d+)/g;
            
            let match;
            while ((match = inProgressPattern.exec(inProgressSection)) !== null) {
                courses.push({
                    term: inProgressTerm,
                    subject: match[1],
                    courseCode: match[2],
                    level: match[3],
                    title: match[4].trim(),
                    creditHours: parseFloat(match[5]),
                    grade: 'IP',
                    qualityPoints: null,
                    status: 'in-progress'
                });
            }
        }

        return courses;
    }

    parseTermTotals(content) {
        const termTotals = [];
        const terms = content.split(/Term Totals \(Undergraduate\)/g);

        terms.slice(1).forEach(termSection => {
            const lines = termSection.split('\n');
            const currentTermLine = lines.find(line => line.includes('Current Term:'));
            
            if (currentTermLine) {
                const numbers = currentTermLine.match(/[\d.]+/g);
                if (numbers && numbers.length >= 6) {
                    termTotals.push({
                        attemptHours: parseFloat(numbers[0]),
                        passedHours: parseFloat(numbers[1]),
                        earnedHours: parseFloat(numbers[2]),
                        gpaHours: parseFloat(numbers[3]),
                        qualityPoints: parseFloat(numbers[4]),
                        gpa: parseFloat(numbers[5])
                    });
                }
            }
        });

        return termTotals;
    }

    parseOverallTotals(content) {
        const totalsSection = content.match(/TRANSCRIPT TOTALS[\s\S]*?Overall:[\s\S]*?(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)/);
        
        if (totalsSection) {
            return {
                attemptHours: parseFloat(totalsSection[1]),
                passedHours: parseFloat(totalsSection[2]),
                earnedHours: parseFloat(totalsSection[3]),
                gpaHours: parseFloat(totalsSection[4]),
                qualityPoints: parseFloat(totalsSection[5]),
                gpa: parseFloat(totalsSection[6])
            };
        }
        
        return null;
    }
}

module.exports = TranscriptParser;