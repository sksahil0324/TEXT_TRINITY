// Script to extract text from PDF files using pdf-parse

import fs from 'fs';
import pdfParse from 'pdf-parse';

// Get file path from command line argument
const filePath = process.argv[2];

if (!filePath) {
  console.error('Error: Please provide a PDF file path');
  process.exit(1);
}

try {
  // Read the PDF file
  const dataBuffer = fs.readFileSync(filePath);

  // Parse the PDF
  pdfParse(dataBuffer)
    .then(data => {
      // Output the text content to stdout
      console.log(data.text);
    })
    .catch(error => {
      console.error('Error parsing PDF:', error.message);
      process.exit(1);
    });
} catch (error) {
  console.error('Error reading PDF file:', error.message);
  process.exit(1);
}