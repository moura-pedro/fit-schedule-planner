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
            
            const studentInfo = this.parseStudentInfo(content);
            const courses = this.parseCourses(content);
            const overallTotals = this.parseOverallTotals(content);

            return {
                studentInfo,
                courses,
                overallTotals
            };
        } catch (error) {
            console.error('Error parsing PDF:', error);
            throw error;
        }
    }

    parseStudentInfo(content) {
        const studentIdMatch = content.match(/(\d{9})\s+([^\n]+)/);
        const nameMatch = content.match(/Name\s*:\s*([^\n]+)/);
        const programMatch = content.match(/Program:\s*([^\n]+)/);
        const collegeMatch = content.match(/College:\s*([^\n]+)/);
        const majorMatch = content.match(/Major and Department:\s*([^\n]+)/);

        // Calculate GPA from overall totals section
        const gpaMatch = content.match(/Overall:[\s\S]*?(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)/);
        const cumulativeGPA = gpaMatch ? parseFloat(gpaMatch[6]) : 0;

        return {
            studentId: studentIdMatch ? studentIdMatch[1] : '',
            name: nameMatch ? nameMatch[1].trim() : '',
            program: programMatch ? programMatch[1].trim() : '',
            college: collegeMatch ? collegeMatch[1].trim() : '',
            major: majorMatch ? majorMatch[1].trim() : '',
            cumulativeGPA
        };
    }

    parseCourses(content) {
        const courses = [];
        // Split content into terms
        const termSections = content.split(/Term: /g);
        
        termSections.slice(1).forEach(termSection => {
            // Get term name
            const termMatch = termSection.match(/^([^\n]+)/);
            if (!termMatch) return;
            
            const term = termMatch[1].trim();
            if (term.includes('TRANSCRIPT TOTALS')) return;

            // Find academic standing
            const standingMatch = termSection.match(/Academic Standing:\s*([^\n]+)/);
            const additionalStandingMatch = termSection.match(/Additional Standing:\s*([^\n]+)/);
            const standing = {
                academic: standingMatch ? standingMatch[1].trim() : '',
                additional: additionalStandingMatch ? additionalStandingMatch[1].trim() : ''
            };

            // Parse courses using more precise regex
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
                    standing,
                    status: 'completed'
                });
            }
        });

        // Parse courses in progress
        const inProgressSection = content.split('COURSES IN PROGRESS')[1];
        if (inProgressSection) {
            const currentTermMatch = inProgressSection.match(/Term:\s*([^\n]+)/);
            const currentTerm = currentTermMatch ? currentTermMatch[1].trim() : 'Current Term';

            // Different regex for in-progress courses
            const inProgressPattern = /(\w+)\s+(\d+)\s+(\d+)\s+([^\n]+?)\s+(\d+\.\d+)/g;
            let match;

            while ((match = inProgressPattern.exec(inProgressSection)) !== null) {
                courses.push({
                    term: currentTerm,
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

    parseOverallTotals(content) {
        const overallMatch = content.match(/Overall:[\s\S]*?(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)/);
        
        if (overallMatch) {
            return {
                attemptHours: parseFloat(overallMatch[1]),
                passedHours: parseFloat(overallMatch[2]),
                earnedHours: parseFloat(overallMatch[3]),
                gpaHours: parseFloat(overallMatch[4]),
                qualityPoints: parseFloat(overallMatch[5]),
                gpa: parseFloat(overallMatch[6])
            };
        }
        
        return null;
    }
}

module.exports = TranscriptParser;