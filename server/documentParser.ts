import zlib from 'zlib';

/**
 * Parses Microsoft Word (.docx) files without external dependencies.
 * A .docx file is a ZIP archive containing XML files, primarily "word/document.xml".
 */
export function extractTextFromDocx(buffer: Buffer): string {
  try {
    // 1. Locate local file headers in the ZIP archive
    // Signature: 0x04034b50 (PK\x03\x04)
    let offset = 0;
    let documentXml: string | null = null;
    const headerXmls: string[] = [];

    while (offset < buffer.length - 30) {
      if (
        buffer[offset] === 0x50 &&
        buffer[offset + 1] === 0x4b &&
        buffer[offset + 2] === 0x03 &&
        buffer[offset + 3] === 0x04
      ) {
        const compressionMethod = buffer.readUInt16LE(offset + 8);
        const compressedSize = buffer.readUInt32LE(offset + 18);
        const uncompressedSize = buffer.readUInt32LE(offset + 22);
        const fileNameLength = buffer.readUInt16LE(offset + 26);
        const extraFieldLength = buffer.readUInt16LE(offset + 28);

        const fileNameStart = offset + 30;
        const fileName = buffer.toString('utf-8', fileNameStart, fileNameStart + fileNameLength);
        const dataStart = fileNameStart + fileNameLength + extraFieldLength;
        const dataEnd = dataStart + compressedSize;

        if (dataEnd <= buffer.length) {
          const compressedData = buffer.subarray(dataStart, dataEnd);

          if (fileName === 'word/document.xml' || fileName.startsWith('word/header') || fileName.startsWith('word/footer')) {
            let decompressed: Buffer;
            if (compressionMethod === 8) {
              // Deflate
              try {
                decompressed = zlib.inflateRawSync(compressedData);
              } catch {
                try {
                  decompressed = zlib.inflateSync(compressedData);
                } catch {
                  decompressed = compressedData;
                }
              }
            } else {
              // Stored (no compression)
              decompressed = compressedData;
            }

            const xmlStr = decompressed.toString('utf-8');
            if (fileName === 'word/document.xml') {
              documentXml = xmlStr;
            } else {
              headerXmls.push(xmlStr);
            }
          }
        }

        offset = dataStart + compressedSize;
      } else {
        offset++;
      }
    }

    if (!documentXml) {
      throw new Error('Could not find word/document.xml inside the DOCX archive.');
    }

    // 2. Parse text from XML: paragraphs (<w:p>), tables (<w:tr>, <w:tc>), text (<w:t>)
    const combinedXml = [...headerXmls, documentXml].join('\n');
    return cleanDocxXml(combinedXml);
  } catch (err: any) {
    console.warn('DOCX extraction error:', err.message);
    throw new Error('Failed to extract readable text from DOCX file: ' + err.message);
  }
}

function cleanDocxXml(xml: string): string {
  // Replace paragraph endings and line breaks with newlines
  let text = xml
    .replace(/<w:p\b[^>]*>/gi, '\n')
    .replace(/<w:br\b[^>]*>/gi, '\n')
    .replace(/<w:cr\b[^>]*>/gi, '\n')
    .replace(/<w:tab\b[^>]*>/gi, '\t')
    .replace(/<\/w:tc>/gi, ' | ')
    .replace(/<\/w:tr>/gi, '\n');

  // Extract all content inside <w:t> tags
  const textMatches: string[] = [];
  const tRegex = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gi;
  let match: RegExpExecArray | null;

  // We can also extract directly by replacing other tags
  text = text.replace(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gi, '$1');
  // Strip any remaining XML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode standard XML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));

  // Clean up excess whitespace and blank lines
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

/**
 * Extracts readable text streams from a PDF buffer without external binaries.
 * Parses PDF text streams, decompression (FlateDecode), and text operators (Tj, TJ, ', ").
 */
export function extractTextFromPdf(buffer: Buffer): string {
  try {
    const rawContent = buffer.toString('binary');
    const extractedParagraphs: string[] = [];

    // 1. Find all stream ... endstream blocks in PDF
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let match: RegExpExecArray | null;

    while ((match = streamRegex.exec(rawContent)) !== null) {
      const streamStart = match.index + match[0].indexOf('\n') + 1;
      const streamDataString = match[1];

      // Check preceding dictionary for /FlateDecode
      const precedingChunk = rawContent.slice(Math.max(0, match.index - 300), match.index);
      const isFlate = /Filter\s*(\/FlateDecode|\[\s*\/FlateDecode\s*\])/i.test(precedingChunk);

      let decompressedText = '';
      if (isFlate) {
        try {
          const streamBuffer = buffer.subarray(streamStart, streamStart + streamDataString.length);
          const decompressed = zlib.inflateSync(streamBuffer);
          decompressedText = decompressed.toString('utf-8');
        } catch {
          try {
            const streamBuffer = buffer.subarray(streamStart, streamStart + streamDataString.length);
            const decompressed = zlib.inflateRawSync(streamBuffer);
            decompressedText = decompressed.toString('utf-8');
          } catch {
            decompressedText = streamDataString;
          }
        }
      } else {
        decompressedText = streamDataString;
      }

      // Extract text operators: Tj, TJ, ', "
      if (decompressedText) {
        const textFromStream = parsePdfStreamText(decompressedText);
        if (textFromStream.trim()) {
          extractedParagraphs.push(textFromStream.trim());
        }
      }
    }

    // 2. Also extract direct text strings in literal parentheses: (Text)
    const directTextMatches: string[] = [];
    const literalStringRegex = /\(([^()]{3,})\)\s*(?:Tj|'|")/g;
    let litMatch: RegExpExecArray | null;
    while ((litMatch = literalStringRegex.exec(rawContent)) !== null) {
      const clean = cleanPdfLiteral(litMatch[1]);
      if (clean && clean.length > 2 && /[a-zA-Z]/.test(clean)) {
        directTextMatches.push(clean);
      }
    }

    const allCombined = [...extractedParagraphs, ...directTextMatches].join('\n');
    const cleaned = allCombined
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 1)
      .join('\n');

    return cleaned;
  } catch (err: any) {
    console.warn('PDF stream extraction warning:', err.message);
    return '';
  }
}

function parsePdfStreamText(stream: string): string {
  const result: string[] = [];

  // Match text blocks inside BT ... ET
  const btRegex = /BT([\s\S]*?)ET/g;
  let btMatch: RegExpExecArray | null;

  while ((btMatch = btRegex.exec(stream)) !== null) {
    const block = btMatch[1];

    // Array text operator: [(Text) 20 (More)] TJ
    const tjArrayRegex = /\[([\s\S]*?)\]\s*TJ/g;
    let arrayMatch: RegExpExecArray | null;
    while ((arrayMatch = tjArrayRegex.exec(block)) !== null) {
      const inner = arrayMatch[1];
      const stringParts: string[] = [];
      const itemRegex = /\(([^)]*)\)/g;
      let item: RegExpExecArray | null;
      while ((item = itemRegex.exec(inner)) !== null) {
        stringParts.push(cleanPdfLiteral(item[1]));
      }
      if (stringParts.length > 0) {
        result.push(stringParts.join(''));
      }
    }

    // Single string text operator: (Text) Tj or ' or "
    const singleTjRegex = /\(([^)]*)\)\s*(?:Tj|'|")/g;
    let singleMatch: RegExpExecArray | null;
    while ((singleMatch = singleTjRegex.exec(block)) !== null) {
      const clean = cleanPdfLiteral(singleMatch[1]);
      if (clean) {
        result.push(clean);
      }
    }
  }

  return result.join('\n');
}

function cleanPdfLiteral(str: string): string {
  return str
    .replace(/\\([0-7]{1,3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)))
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\b/g, '\b')
    .replace(/\\f/g, '\f')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .trim();
}

/**
 * Universal document text extractor supporting Plain Text, PDF, and DOCX.
 */
export async function extractDocumentText(
  buffer: Buffer,
  fileType?: string,
  fileName?: string
): Promise<{ text: string; method: 'plaintext' | 'docx' | 'pdf' }> {
  const name = (fileName || '').toLowerCase();
  const mime = (fileType || '').toLowerCase();

  // 1. DOCX
  if (name.endsWith('.docx') || mime.includes('wordprocessingml') || mime.includes('docx')) {
    const text = extractTextFromDocx(buffer);
    return { text, method: 'docx' };
  }

  // 2. PDF
  if (name.endsWith('.pdf') || mime.includes('pdf')) {
    const text = extractTextFromPdf(buffer);
    return { text, method: 'pdf' };
  }

  // 3. Plain Text / Markdown / Other Text formats
  const rawUtf8 = buffer.toString('utf-8');
  // Check if buffer is valid UTF-8 text
  if (rawUtf8 && rawUtf8.length > 10) {
    return { text: rawUtf8, method: 'plaintext' };
  }

  return { text: '', method: 'plaintext' };
}
