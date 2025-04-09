
# TextTrinity: NLP-Powered Text Processing Application

## Overview
An advanced NLP-powered web application for text translation, summarization, content generation, and keyword extraction with file upload support. Developed by Sahil Basheer Shaikh.

## Features
- **Text Translation**: Support for multiple languages with formality control
- **Advanced Text Summarization**: Enhanced TF-IDF with BM25+ weighting, semantic clustering, and copyright-friendly paraphrasing
- **Content Generation**: Context-aware content creation with stylistic control
- **Keyword Extraction**: Multiple algorithms including enhanced TF-IDF and BERT-based approaches
- **Document Processing**: Support for PDF and image file formats with OCR capabilities
- **User Authentication**: Secure login/registration system with session management
- **History Tracking**: Comprehensive activity logging for all text operations

## Technical Highlights
- Client-server architecture with React frontend and Node.js/Express backend
- PostgreSQL database integration with Drizzle ORM
- Advanced TF-IDF implementations with several enhancements:
  - BM25+ algorithm for better term weighting
  - Semantic clustering to reduce redundancy
  - Position-based weighting with Gaussian distribution
  - Multi-word phrase extraction
  - Light paraphrasing for copyright-friendly output

## Getting Started

### Prerequisites
- Node.js (v16+)
- PostgreSQL database
- API keys for external services (optional)

### Installation
1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/nlp-text-processor.git
   cd nlp-text-processor
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   Create a `.env` file in the root directory with the following:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/dbname
   SESSION_SECRET=your_secret_key
   OPENAI_API_KEY=your_openai_api_key (optional)
   ```

4. Run database migrations
   ```bash
   npm run db:push
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

## Project Structure
- `/client`: React frontend
- `/server`: Express backend
- `/shared`: Shared types and schemas
- `/server/nlp`: NLP processing algorithms

## Author
Sahil Basheer Shaikh

## License
All rights reserved. This project and its source code are proprietary and confidential.
Unauthorized copying, distribution, or use of this code is strictly prohibited.
=======
# TEXT_TRINITY
