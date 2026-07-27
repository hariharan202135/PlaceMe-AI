import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export interface IDocumentTextResult {
  text: string;
  fileType: 'pdf' | 'doc' | 'docx';
}

export const extractTextFromBuffer = async (buffer: Buffer, fileName: string): Promise<IDocumentTextResult> => {
  const ext = (fileName || '').toLowerCase().split('.').pop() || '';

  // Detect file type by magic bytes or file extension
  const isPdf = (buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) || ext === 'pdf';
  const isDocx = ext === 'docx' || (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04);
  const isDoc = ext === 'doc' || (buffer.length >= 8 && buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0);

  if (!isPdf && !isDocx && !isDoc) {
    throw new Error('Unsupported file format. Please upload a PDF (.pdf) or Microsoft Word document (.doc, .docx).');
  }

  let extractedText = '';
  const detectedType: 'pdf' | 'doc' | 'docx' = isPdf ? 'pdf' : (isDocx ? 'docx' : 'doc');

  if (isPdf) {
    try {
      const parsedPdf = await pdf(buffer);
      extractedText = parsedPdf.text || '';
    } catch (parseError) {
      console.warn('PDF parser warning, using fallback buffer extraction:', parseError);
      extractedText = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, '');
    }
  } else {
    // DOC / DOCX Parsing via Mammoth
    try {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value || '';
    } catch (docError) {
      console.warn('Mammoth Word extraction warning, using string dump fallback:', docError);
      extractedText = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, '');
    }
  }

  // Normalize extracted text
  const normalizedText = extractedText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!normalizedText || normalizedText.length < 30) {
    throw new Error('Could not extract readable text from the file. Please ensure it is a valid PDF or Word document.');
  }

  return {
    text: normalizedText,
    fileType: detectedType
  };
};
