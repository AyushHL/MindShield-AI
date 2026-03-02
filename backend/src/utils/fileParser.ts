const pdf = require('pdf-parse');
import mammoth from 'mammoth';

export const parseFile = async (buffer: Buffer, mimetype: string): Promise<string> => {
  if (mimetype === 'application/pdf') {
    const data = await pdf(buffer);
    return data.text;
  } else if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } else {
    // Default to plain text
    return buffer.toString('utf-8');
  }
};