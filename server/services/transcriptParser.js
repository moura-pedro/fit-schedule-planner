const pdfParse = require('pdf-parse');
const { parseTranscriptWithGPT } = require('./openaiService');

class TranscriptParser {
    constructor(buffer) {
        this.buffer = buffer;
    }

    async parse() {
        try {
            const pdfData = await pdfParse(this.buffer);
            const content = pdfData.text;
            
            // Use OpenAI to parse the transcript
            const parsedData = await parseTranscriptWithGPT(content);
            
            return parsedData;
        } catch (error) {
            console.error('Error parsing transcript:', error);
            throw error;
        }
    }
}

module.exports = TranscriptParser;