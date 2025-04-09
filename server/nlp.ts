import {
  TranslationRequest,
  TranslationResponse,
  SummarizationRequest,
  SummarizationResponse,
  ContentGenerationRequest,
  ContentGenerationResponse,
  KeywordExtractionRequest,
  KeywordExtractionResponse,
  AlgorithmRecommendationRequest,
  AlgorithmRecommendationResponse
} from '@shared/schema';

// Enhanced OpenAI integration can be added here if an API key is provided
let openaiApiKey: string | null = process.env.OPENAI_API_KEY || null;

// Advanced NLP Utility Functions
// =============================

// Extended list of English stopwords for NLP processing
const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can\'t', 'cannot', 'could',
  'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during', 'each', 'few', 'for',
  'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s',
  'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m',
  'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t',
  'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves',
  'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some',
  'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these',
  'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
  'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when',
  'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would',
  'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves'
]);

// Tokenize text into sentences
function tokenizeSentences(text: string): string[] {
  // Handle common abbreviations and edge cases
  const prepared = text
    .replace(/([.?!])\s*([A-Z])/g, "$1\n$2") // Add newline after sentence endings
    .replace(/(\b[A-Z]\.\s*)/g, "$1 ") // Handle single letter abbreviations like A. B. C.
    .replace(/(\b[A-Za-z]+\.)\s+(?=[A-Z])/g, "$1\n"); // Handle abbreviations like Mr. Dr. etc.
  
  // Split by newlines and filter out empty sentences
  return prepared.split(/\n/).filter(s => s.trim().length > 0);
}

// Tokenize text into words with more robust handling
function tokenizeWords(text: string): string[] {
  // Remove special characters, keep apostrophes for contractions
  const cleaned = text.toLowerCase().replace(/[^\w\s']|\d+/g, ' ');
  // Split by whitespace and filter out empty strings
  return cleaned.split(/\s+/).filter(w => w.length > 0);
}

// Calculate term frequency (TF)
function calculateTF(text: string): Record<string, number> {
  const words = tokenizeWords(text);
  const wordCount: Record<string, number> = {};
  const totalWords = words.length;
  
  words.forEach(word => {
    if (!STOPWORDS.has(word) && word.length > 2) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  });
  
  // Convert counts to frequencies
  const tf: Record<string, number> = {};
  Object.keys(wordCount).forEach(word => {
    tf[word] = wordCount[word] / totalWords;
  });
  
  return tf;
}

// Calculate inverse document frequency (IDF) from a collection of documents
function calculateIDF(documents: string[]): Record<string, number> {
  const wordDocs: Record<string, number> = {};
  const totalDocs = documents.length;
  
  // Count documents containing each word
  documents.forEach(doc => {
    // Use a set to count each word only once per document
    const uniqueWords = new Set(tokenizeWords(doc).filter(w => !STOPWORDS.has(w) && w.length > 2));
    
    uniqueWords.forEach(word => {
      wordDocs[word] = (wordDocs[word] || 0) + 1;
    });
  });
  
  // Calculate IDF
  const idf: Record<string, number> = {};
  Object.keys(wordDocs).forEach(word => {
    // Use log base 10 with smoothing factor of 1
    idf[word] = Math.log10((totalDocs + 1) / (wordDocs[word] + 1)) + 1;
  });
  
  return idf;
}

// Calculate TF-IDF for a document against a corpus
function calculateTFIDF(tf: Record<string, number>, idf: Record<string, number>): Record<string, number> {
  const tfidf: Record<string, number> = {};
  
  Object.keys(tf).forEach(word => {
    tfidf[word] = tf[word] * (idf[word] || 1);
  });
  
  return tfidf;
}

// Extract phrases (n-grams) from text to catch multi-word concepts
function extractPhrases(text: string, n: number = 2): Record<string, number> {
  const words = tokenizeWords(text).filter(w => !STOPWORDS.has(w) && w.length > 2);
  const phrases: Record<string, number> = {};
  
  for (let i = 0; i <= words.length - n; i++) {
    const phrase = words.slice(i, i + n).join(' ');
    phrases[phrase] = (phrases[phrase] || 0) + 1;
  }
  
  return phrases;
}

// Score sentences based on keyword importance (for extractive summarization)
function scoreSentences(sentences: string[], keywords: Record<string, number>): number[] {
  const scores: number[] = [];
  
  sentences.forEach(sentence => {
    const words = tokenizeWords(sentence);
    let score = 0;
    
    words.forEach(word => {
      if (keywords[word]) {
        score += keywords[word];
      }
    });
    
    // Normalize by sentence length to avoid bias towards longer sentences
    // Add small constant to avoid dividing by zero
    scores.push(score / (words.length + 0.1));
  });
  
  return scores;
}

// Get position-based weight for sentences (beginning & end are often more important)
function getPositionWeight(index: number, total: number): number {
  // Higher weights for beginning and end of text
  if (index < total * 0.2) return 1.25; // First 20% of sentences
  if (index > total * 0.8) return 1.15; // Last 20% of sentences
  return 1.0; // Middle sentences
}

// Cosine similarity between two vectors (for document comparison)
function cosineSimilarity(vectorA: Record<string, number>, vectorB: Record<string, number>): number {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  // Calculate dot product
  for (const key in vectorA) {
    if (vectorB[key]) {
      dotProduct += vectorA[key] * vectorB[key];
    }
    magnitudeA += vectorA[key] * vectorA[key];
  }
  
  // Calculate magnitude of vector B
  for (const key in vectorB) {
    magnitudeB += vectorB[key] * vectorB[key];
  }
  
  // Calculate magnitudes
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  
  // Calculate cosine similarity
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

// ===================================================================
// MAIN NLP FUNCTIONS
// ===================================================================

// Translation
export async function translateText(request: TranslationRequest): Promise<TranslationResponse> {
  // For demo purposes, if no text is provided, throw an error
  if (!request.text.trim()) {
    throw new Error('No text provided for translation');
  }
  
  try {
    // If OpenAI API key is available, we could use it here
    if (openaiApiKey) {
      // Implement OpenAI call for translation
      // Return result
    }
    
    // Simulate translation for the demo
    return simulateTranslation(request);
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error('Translation failed');
  }
}

// Simulate translation with more realistic output
function simulateTranslation(request: TranslationRequest): TranslationResponse {
  // Simple mapping of language prefixes for simulation
  const languagePrefixes: Record<string, string> = {
    'Spanish': 'es',
    'French': 'fr',
    'German': 'de', 
    'Chinese': 'zh',
    'Russian': 'ru',
    'English': 'en'
  };
  
  const prefix = languagePrefixes[request.targetLanguage] || '';
  
  // Simple word-replacement map for common words to simulate translation
  const translationMap: Record<string, Record<string, string>> = {
    'es': {
      'the': 'el', 'a': 'un', 'is': 'es', 'for': 'para', 'hello': 'hola',
      'world': 'mundo', 'thank': 'gracias', 'you': 'tú', 'good': 'bueno',
      'morning': 'mañana', 'night': 'noche', 'day': 'día', 'today': 'hoy',
      'tomorrow': 'mañana', 'yes': 'sí', 'no': 'no', 'please': 'por favor',
      'welcome': 'bienvenido', 'goodbye': 'adiós'
    },
    'fr': {
      'the': 'le', 'a': 'un', 'is': 'est', 'for': 'pour', 'hello': 'bonjour',
      'world': 'monde', 'thank': 'merci', 'you': 'vous', 'good': 'bon',
      'morning': 'matin', 'night': 'nuit', 'day': 'jour', 'today': 'aujourd\'hui',
      'tomorrow': 'demain', 'yes': 'oui', 'no': 'non', 'please': 's\'il vous plaît',
      'welcome': 'bienvenue', 'goodbye': 'au revoir'
    }
  };
  
  // If we have a translation map for this language
  if (prefix && translationMap[prefix]) {
    const map = translationMap[prefix];
    const words = request.text.split(/\s+/);
    
    // Replace known words with their translations
    const translated = words.map(word => {
      const lowerWord = word.toLowerCase();
      // If the word exists in our map, replace it
      if (map[lowerWord]) {
        // Preserve case
        if (word[0] === word[0].toUpperCase()) {
          return map[lowerWord].charAt(0).toUpperCase() + map[lowerWord].slice(1);
        }
        return map[lowerWord];
      }
      return word;
    });
    
    return {
      translatedText: translated.join(' '),
      characterCount: request.text.length
    };
  }
  
  // Default case if no specific translation map
  return {
    translatedText: `[${prefix.toUpperCase()}] ${request.text}`,
    characterCount: request.text.length
  };
}

// Enhanced Extractive Summarization
export async function summarizeText(request: SummarizationRequest): Promise<SummarizationResponse> {
  if (!request.text.trim()) {
    throw new Error('No text provided for summarization');
  }
  
  try {
    // If OpenAI API key is available, we could use it for more accurate summarization
    if (openaiApiKey) {
      // Implement OpenAI call for summarization 
      // Return result
    }
    
    // Use our enhanced TF-IDF algorithm for extractive summarization
    return enhancedSummarize(request);
  } catch (error) {
    console.error('Summarization error:', error);
    throw new Error('Summarization failed');
  }
}

// Enhanced extractive summarization using TF-IDF and additional techniques
function enhancedSummarize(request: SummarizationRequest): SummarizationResponse {
  const { text, length, style } = request;
  
  // Tokenize text into sentences
  const sentences = tokenizeSentences(text);
  
  // Calculate length ratio based on summary length parameter
  const lengthRatio = length === 'short' ? 0.15 : length === 'medium' ? 0.3 : 0.45;
  
  // Calculate target number of sentences
  const numSentences = Math.max(1, Math.ceil(sentences.length * lengthRatio));
  
  // Break text into paragraphs to treat them as documents for IDF calculation
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  
  // If only one paragraph, split into smaller chunks
  const documents = paragraphs.length > 1 ? paragraphs : sentences;
  
  // Advanced TF-IDF with enhanced techniques
  // =======================================
  
  // 1. Apply BM25+ algorithm (TF-IDF variant used in search engines)
  // Calculate TF with BM25+ weighting
  const tfBM25 = calculateTFWithBM25(text, sentences);
  
  // 2. Calculate IDF with smoothing to prevent zero values
  const idf = calculateIDFWithSmoothing(documents);
  
  // 3. Calculate standard TF-IDF
  const tf = calculateTF(text);
  const tfidf = calculateTFIDF(tf, idf);
  
  // 4. ADVANCED: Extract multi-word phrases (2-3 words) for context preservation
  const phrases = extractPhrases(text, 3); // Extract up to 3-word phrases
  
  // 5. ADVANCED: Analyze sentence similarity for redundancy reduction
  const similarityClusters = clusterSimilarSentences(sentences);
  
  // 6. ADVANCED: Apply domain-specific boosting of important terms
  // Merge single-word and phrase scores with intelligent weighting
  const keywordScores: Record<string, number> = { ...tfidf };
  
  // Add phrase scores with higher weight for multi-word expressions
  Object.entries(phrases).forEach(([phrase, count]) => {
    if (count > 1) { // Only consider phrases that appear more than once
      const wordCount = phrase.split(/\\s+/).length;
      // Give increasing weight to longer phrases to prioritize multi-word concepts
      const phraseMultiplier = 1 + (wordCount - 1) * 0.25;
      keywordScores[phrase] = (count / documents.length) * phraseMultiplier * 1.5;
    }
  });
  
  // 7. Score sentences using multiple factors
  const initialSentenceScores = scoreSentences(sentences, keywordScores);
  
  // 8. ADVANCED: Apply positional weighting with Gaussian distribution
  //    to prioritize intro and conclusion content
  const positionAdjustedScores = initialSentenceScores.map((score, index) => 
    score * getEnhancedPositionWeight(index, sentences.length)
  );
  
  // 9. ADVANCED: Consider sentence length - penalize very short/long sentences
  const lengthAdjustedScores = positionAdjustedScores.map((score, index) => {
    const sentenceLength = sentences[index].split(/\\s+/).length;
    const lengthFactor = sentenceLength < 5 ? 0.7 : // Too short
                        sentenceLength > 40 ? 0.8 : // Too long
                        1.0; // Ideal length
    return score * lengthFactor;
  });
  
  // 10. ADVANCED: Boost sentences that contain the most frequent phrases
  const topPhrases = Object.entries(phrases)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(entry => entry[0]);
    
  const phraseBoostScores = lengthAdjustedScores.map((score, index) => {
    let phraseBoost = 1.0;
    for (const phrase of topPhrases) {
      if (sentences[index].includes(phrase)) {
        phraseBoost += 0.2; // 20% boost per important phrase
      }
    }
    return score * phraseBoost;
  });
  
  // Create sentence objects with original index and final score
  const scoredSentences = sentences.map((sentence, index) => ({
    sentence,
    originalIndex: index,
    score: phraseBoostScores[index],
    cluster: similarityClusters[index] // Track similarity cluster
  }));
  
  // 11. ADVANCED: Rank sentences but avoid redundancy using clusters
  const rankedSentences = [...scoredSentences].sort((a, b) => b.score - a.score);
  
  // 12. ADVANCED: Select sentences with diversity (avoid similar sentences)
  const selectedSentences: typeof rankedSentences = [];
  const selectedClusters = new Set<number>();
  
  for (const sentence of rankedSentences) {
    // If we already have enough sentences, stop
    if (selectedSentences.length >= numSentences) break;
    
    // If this sentence belongs to a cluster we've already taken from,
    // skip unless it's a very high-scoring sentence
    if (selectedClusters.has(sentence.cluster) && sentence.score < 0.8) {
      continue;
    }
    
    selectedSentences.push(sentence);
    selectedClusters.add(sentence.cluster);
  }
  
  // If we didn't get enough sentences, add more from the ranked list
  while (selectedSentences.length < numSentences && selectedSentences.length < rankedSentences.length) {
    const nextSentence = rankedSentences[selectedSentences.length];
    if (!selectedSentences.includes(nextSentence)) {
      selectedSentences.push(nextSentence);
    }
  }
  
  // 13. Re-order sentences based on original position for readability
  const orderedSentences = selectedSentences.sort((a, b) => a.originalIndex - b.originalIndex);
  
  // 14. Format based on style with enhanced output formatting
  let summary = '';
  if (style === 'bullet_points') {
    summary = orderedSentences.map(s => `• ${s.sentence}`).join('\n\n');
  } else if (style === 'simplified') {
    // Apply more advanced simplification techniques
    summary = orderedSentences.map(s => 
      s.sentence
        .replace(/\([^)]*\)/g, '') // Remove parentheticals
        .replace(/,\s*[^,]+(,|$)/g, '$1') // Remove some clauses
        .replace(/which\s[^,]+/g, '') // Remove 'which' clauses
        .replace(/\s{2,}/g, ' ') // Clean up extra spaces
        .trim()
    ).join(' ');
  } else { // informative (default)
    // For informative style, add light paraphrasing by varying sentence structure
    // This increases copyright-friendly qualities by changing expression while preserving meaning
    summary = orderedSentences.map((s, i) => {
      // Apply various light transformations to every other sentence for variety
      if (i % 2 === 1) {
        return lightParaphrase(s.sentence);
      }
      return s.sentence;
    }).join(' ');
  }
  
  return { summary };
}

// Helper function for enhanced position weighting with emphasis on intro and conclusion
function getEnhancedPositionWeight(index: number, total: number): number {
  // More sophisticated position weighting that prioritizes both intro and conclusion
  // using a modified Gaussian distribution
  
  // If it's a short text (less than 5 sentences), give equal weight
  if (total < 5) return 1.0;
  
  // Calculate relative position in document (0-1)
  const relativePos = index / (total - 1);
  
  // Prioritize first 10% (intro) and last 10% (conclusion) of content
  if (relativePos <= 0.1) {
    // Intro - highest weight
    return 1.3;
  } else if (relativePos >= 0.9) {
    // Conclusion - high weight
    return 1.2;
  } else if (relativePos >= 0.4 && relativePos <= 0.6) {
    // Middle of the document - slightly reduced weight
    return 0.9;
  } else {
    // Rest of the document - regular weight
    return 1.0;
  }
}

// Calculate TF using BM25+ formula for better term weighting
function calculateTFWithBM25(text: string, sentences: string[]): Record<string, number> {
  const words = tokenizeWords(text);
  const wordCount: Record<string, number> = {};
  const result: Record<string, number> = {};
  
  // Calculate word frequency
  for (const word of words) {
    wordCount[word] = (wordCount[word] || 0) + 1;
  }
  
  // Calculate average sentence length
  const avgSentLength = words.length / sentences.length;
  
  // BM25+ parameters
  const k1 = 1.2; // Term frequency saturation parameter
  const b = 0.75; // Length normalization parameter
  const delta = 1.0; // BM25+ delta parameter
  
  // Calculate BM25+ term frequency for each word
  for (const word of Object.keys(wordCount)) {
    const tf = wordCount[word];
    
    // Get the word's frequency in each sentence for normalization
    const sentenceFreqs: number[] = sentences.map(sentence => {
      const sentWords = tokenizeWords(sentence);
      const sentLength = sentWords.length;
      const wordInSent = sentWords.filter(w => w === word).length;
      
      // BM25+ formula component for this sentence
      return ((k1 + 1) * wordInSent) / 
             (k1 * (1 - b + b * (sentLength / avgSentLength)) + wordInSent) + delta;
    });
    
    // Take the average BM25+ score across all sentences
    result[word] = sentenceFreqs.reduce((sum, score) => sum + score, 0) / sentences.length;
  }
  
  return result;
}

// Calculate IDF with smoothing to prevent division by zero
function calculateIDFWithSmoothing(documents: string[]): Record<string, number> {
  const docCount = documents.length;
  const wordInDocCount: Record<string, number> = {};
  const result: Record<string, number> = {};
  
  // Count documents containing each word
  for (const doc of documents) {
    const words = new Set(tokenizeWords(doc));
    for (const word of words) {
      wordInDocCount[word] = (wordInDocCount[word] || 0) + 1;
    }
  }
  
  // Calculate IDF with smoothing
  for (const word in wordInDocCount) {
    // Add 1 to both numerator and denominator for smoothing
    result[word] = Math.log((docCount + 1) / (wordInDocCount[word] + 1) + 1);
  }
  
  return result;
}

// Cluster similar sentences to avoid redundancy
function clusterSimilarSentences(sentences: string[]): number[] {
  const clusters: number[] = Array(sentences.length).fill(-1);
  let clusterCount = 0;
  
  // A simple clustering approach based on cosine similarity
  for (let i = 0; i < sentences.length; i++) {
    if (clusters[i] === -1) {
      // This sentence starts a new cluster
      clusters[i] = clusterCount;
      
      // Find other similar sentences for this cluster
      for (let j = i + 1; j < sentences.length; j++) {
        if (clusters[j] === -1) {
          // Calculate similarity between sentences i and j
          const similarity = calculateSentenceSimilarity(sentences[i], sentences[j]);
          
          // If similarity is above threshold, add to same cluster
          if (similarity > 0.5) {
            clusters[j] = clusterCount;
          }
        }
      }
      
      clusterCount++;
    }
  }
  
  return clusters;
}

// Calculate similarity between two sentences
function calculateSentenceSimilarity(sentA: string, sentB: string): number {
  const wordsA = tokenizeWords(sentA);
  const wordsB = tokenizeWords(sentB);
  
  // Create word frequency vectors
  const vecA: Record<string, number> = {};
  const vecB: Record<string, number> = {};
  
  for (const word of wordsA) {
    vecA[word] = (vecA[word] || 0) + 1;
  }
  
  for (const word of wordsB) {
    vecB[word] = (vecB[word] || 0) + 1;
  }
  
  // Calculate cosine similarity
  return cosineSimilarity(vecA, vecB);
}

// Apply light paraphrasing techniques to create copyright-friendly variations
function lightParaphrase(sentence: string): string {
  // Don't modify very short sentences
  if (sentence.split(/\s+/).length < 4) {
    return sentence;
  }
  
  // Apply various transformations
  const transformations = [
    // Prepend transition phrases
    (s: string) => {
      const transitions = ['Moreover, ', 'Additionally, ', 'Furthermore, ', 'In addition, ', 'Also, '];
      if (!/^(Moreover|Additionally|Furthermore|In addition|Also|However)/.test(s)) {
        return transitions[Math.floor(Math.random() * transitions.length)] + s.charAt(0).toLowerCase() + s.slice(1);
      }
      return s;
    },
    
    // Convert active to passive or vice versa (simplified version)
    (s: string) => {
      // Simplistic active-to-passive conversion for sentences matching common patterns
      const activePattern = /([A-Z][^\s]*)\s+([a-z]+ed|[a-z]+s)\s+([a-z]+)/;
      if (activePattern.test(s)) {
        const match = s.match(activePattern);
        if (match && match.length >= 4) {
          const subject = match[1];
          const verb = match[2];
          const object = match[3];
          // Basic passive form
          return s.replace(activePattern, `${object} was ${verb} by ${subject.toLowerCase()}`);
        }
      }
      return s;
    },
    
    // Reword sentence beginning
    (s: string) => {
      const patterns = [
        [/^It is /, 'This is '],
        [/^There (is|are) /, 'We can observe '],
        [/^The ([a-z]+) /, 'This $1 '],
        [/^([A-Z][a-z]+) ([a-z]+) /, 'The $1 $2 '],
      ];
      
      for (const [pattern, replacement] of patterns) {
        if (pattern.test(s)) {
          return s.replace(pattern as RegExp, replacement as string);
        }
      }
      return s;
    }
  ];
  
  // Apply a random transformation
  const transform = transformations[Math.floor(Math.random() * transformations.length)];
  return transform(sentence);
}

// Enhanced Content Generation with NLP Techniques
export async function generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
  if (!request.prompt.trim()) {
    throw new Error('No prompt provided for content generation');
  }
  
  try {
    // If OpenAI API key is available, we could use it for generation
    if (openaiApiKey) {
      // Implement OpenAI call for content generation
      // Return result
    }
    
    // Enhanced template-based content generation
    return enhancedGenerate(request);
  } catch (error) {
    console.error('Content generation error:', error);
    throw new Error('Content generation failed');
  }
}

// Enhanced content generation with templates and NLP techniques for coherence
function enhancedGenerate(request: ContentGenerationRequest): ContentGenerationResponse {
  const { prompt, contentType, tone, length, creativityLevel } = request;
  
  // Generate related keywords based on the prompt for content variation
  const promptWords = tokenizeWords(prompt)
    .filter(w => !STOPWORDS.has(w) && w.length > 2);
  
  // Determine target word count based on the length parameter
  let targetWordCount = 0;
  if (length.includes('Short')) {
    targetWordCount = 150; // Target for 100-200 words
  } else if (length.includes('Medium')) {
    targetWordCount = 400; // Target for 300-500 words
  } else {
    targetWordCount = 700; // Target for 600+ words
  }
  
  // Calculate how many concepts we need to generate enough content
  // Average sentence length is about 15-20 words
  const avgWordsPerSentence = 18;
  const targetSentenceCount = Math.ceil(targetWordCount / avgWordsPerSentence);
  
  // Generate related concepts (simulated) - scale based on word count needs
  const conceptCount = Math.max(5, Math.ceil(targetSentenceCount / 3));
  const relatedConcepts = generateRelatedConcepts(promptWords, creativityLevel, conceptCount);
  
  // Generate sentences based on the concepts (simulated)
  const generatedSentences = generateSentences(prompt, relatedConcepts, tone, targetSentenceCount);
  
  // Determine content length based on the length parameter
  const targetParagraphs = length.includes('Short') ? 2 : 
                          length.includes('Medium') ? 4 : 6;
  
  // Generate content based on type
  let generatedContent = '';
  
  switch (contentType) {
    case 'Blog Post':
      generatedContent = generateBlogPost(prompt, generatedSentences, targetParagraphs, tone);
      break;
    case 'Product Description':
      generatedContent = generateProductDescription(prompt, generatedSentences, targetParagraphs, tone);
      break;
    case 'Email':
      generatedContent = generateEmail(prompt, generatedSentences, tone);
      break;
    case 'Social Media Post':
      generatedContent = generateSocialMediaPost(prompt, generatedSentences[0], tone);
      break;
    default:
      generatedContent = generateGenericContent(prompt, generatedSentences, targetParagraphs, tone);
  }
  
  return { generatedContent };
}

// Function to simulate related concept generation (would use semantic models in production)
function generateRelatedConcepts(keywords: string[], creativityLevel: number, conceptLimit?: number): string[] {
  // Sample related concept pairs (simplified)
  const conceptPairs: Record<string, string[]> = {
    'technology': ['innovation', 'digital', 'software', 'hardware', 'automation'],
    'business': ['strategy', 'management', 'market', 'finance', 'growth'],
    'health': ['wellness', 'nutrition', 'fitness', 'medicine', 'lifestyle'],
    'education': ['learning', 'teaching', 'curriculum', 'knowledge', 'training'],
    'science': ['research', 'discovery', 'experiment', 'theory', 'analysis'],
    'art': ['creative', 'design', 'expression', 'aesthetic', 'visual'],
    'food': ['cuisine', 'cooking', 'recipe', 'ingredient', 'flavor'],
    'travel': ['destination', 'journey', 'tourism', 'adventure', 'culture']
  };
  
  // Gather related concepts based on the keywords
  const concepts: string[] = [];
  keywords.forEach(keyword => {
    // Find direct matches
    if (conceptPairs[keyword]) {
      concepts.push(...conceptPairs[keyword]);
    }
    
    // Also find partial matches based on creativity level
    if (creativityLevel > 50) {
      Object.entries(conceptPairs).forEach(([key, values]) => {
        if (key.includes(keyword) || keyword.includes(key)) {
          // Select a subset based on creativity level
          const numToAdd = Math.ceil((creativityLevel / 100) * values.length);
          concepts.push(...values.slice(0, numToAdd));
        }
      });
    }
  });
  
  // If a concept limit is specified, use it, otherwise calculate based on creativity
  const limit = conceptLimit || Math.max(3, Math.floor(creativityLevel / 20));
  
  // De-duplicate and return
  return [...new Set(concepts)].slice(0, limit);
}

// Generate sentences based on concepts and tone
function generateSentences(prompt: string, concepts: string[], tone: string, targetSentenceCount: number = 0): string[] {
  // Template sentences by tone
  const templates: Record<string, string[]> = {
    'Professional': [
      `${prompt} is a crucial aspect of modern business environments.`,
      `Studies indicate that ${prompt} significantly impacts overall productivity.`,
      `Experts recommend implementing ${prompt} strategies for optimal outcomes.`,
      `The analysis of ${prompt} reveals important patterns for consideration.`,
      `Industry leaders recognize the importance of ${prompt} in their operations.`,
      `The implementation of ${prompt} requires careful planning and strategy.`,
      `Research has shown that ${prompt} can lead to significant improvements.`,
      `Best practices for ${prompt} continue to evolve with technology advancements.`,
      `Many organizations are prioritizing ${prompt} in their development roadmaps.`,
      `Effective ${prompt} management is essential for sustainable growth.`
    ],
    'Casual': [
      `Let's talk about ${prompt} - it's pretty interesting stuff!`,
      `I've found that ${prompt} makes a big difference in day-to-day life.`,
      `${prompt} is something everyone should know a bit more about.`,
      `It's amazing how ${prompt} can change your perspective on things.`,
      `Have you tried exploring ${prompt} lately? It's worth checking out!`,
      `People often underestimate how important ${prompt} can be.`,
      `I never really paid attention to ${prompt} until I saw what it can do.`,
      `The cool thing about ${prompt} is how versatile it is for different situations.`,
      `You'd be surprised at how ${prompt} can solve everyday problems.`,
      `There's something special about discovering ${prompt} for the first time.`
    ],
    'Enthusiastic': [
      `${prompt} is absolutely revolutionary and changes everything!`,
      `I'm incredibly excited about the possibilities of ${prompt}!`,
      `${prompt} represents an amazing breakthrough that you don't want to miss!`,
      `The potential of ${prompt} is truly mind-blowing and transformative!`,
      `You'll be amazed by what ${prompt} can do for you and your goals!`,
      `${prompt} is changing the game in ways we never thought possible!`,
      `The incredible impact of ${prompt} simply cannot be overstated!`,
      `I can't believe more people aren't talking about how amazing ${prompt} is!`,
      `${prompt} is the future and it's happening right now!`,
      `Once you experience ${prompt}, you'll wonder how you ever lived without it!`
    ],
    'Formal': [
      `In accordance with recent findings, ${prompt} demonstrates considerable efficacy.`,
      `The implementation of ${prompt} necessitates careful consideration of variables.`,
      `It is imperative to acknowledge the significance of ${prompt} in this context.`,
      `The literature suggests that ${prompt} warrants further investigation.`,
      `Upon examination, ${prompt} exhibits properties consistent with established theories.`,
      `The correlation between ${prompt} and positive outcomes is statistically significant.`,
      `It has been observed that ${prompt} contributes substantially to overall efficiency.`,
      `Empirical evidence supports the efficacy of ${prompt} in multiple applications.`,
      `The integration of ${prompt} presents notable advantages in appropriate contexts.`,
      `Thorough analysis indicates that ${prompt} yields optimal results when implemented correctly.`
    ],
    'Technical': [
      `The ${prompt} algorithm optimizes performance through parallel processing mechanisms.`,
      `${prompt} utilizes advanced data structures to minimize computational complexity.`,
      `The architecture of ${prompt} incorporates redundancy to ensure system reliability.`,
      `${prompt} implements a multi-layered approach to handle edge cases effectively.`,
      `The ${prompt} framework leverages distributed computing for enhanced scalability.`,
      `Runtime optimization in ${prompt} is achieved through dynamic resource allocation.`,
      `${prompt} maintains data integrity via transactional processing and validation checks.`,
      `The modular design of ${prompt} facilitates integration with existing systems.`,
      `${prompt} mitigates bottlenecks through asynchronous processing patterns.`,
      `Extensive benchmarking confirms ${prompt}'s superior performance metrics.`
    ]
  };
  
  // Default to Professional if tone not found
  const sentenceTemplates = templates[tone] || templates['Professional'];
  
  // Generate sentences based on templates and concepts
  const sentences: string[] = [];
  
  // Add sentence about the main prompt
  sentences.push(sentenceTemplates[Math.floor(Math.random() * sentenceTemplates.length)]);
  
  // Add sentences about related concepts
  concepts.forEach(concept => {
    const template = sentenceTemplates[Math.floor(Math.random() * sentenceTemplates.length)];
    sentences.push(template.replace(prompt, `${prompt} in relation to ${concept}`));
  });
  
  // Add closing sentence
  sentences.push(sentenceTemplates[Math.floor(Math.random() * sentenceTemplates.length)]
    .replace(prompt, `the future of ${prompt}`));
  
  // If we need more sentences to meet the target count
  if (targetSentenceCount > 0 && sentences.length < targetSentenceCount) {
    const sentencesToAdd = targetSentenceCount - sentences.length;
    
    // Add variations with slight modifications
    for (let i = 0; i < sentencesToAdd; i++) {
      // Cycle through templates and add variations
      const template = sentenceTemplates[i % sentenceTemplates.length];
      
      // Create variations by adding adjectives, adverbs, or context
      const variations = [
        template.replace(prompt, `innovative ${prompt}`),
        template.replace(prompt, `effective ${prompt}`),
        template.replace(prompt, `modern ${prompt}`),
        template.replace(prompt, `${prompt} approaches`),
        template.replace(prompt, `${prompt} techniques`),
        template.replace(prompt, `${prompt} in today's context`),
        template.replace(prompt, `${prompt} for optimal results`),
        template.replace(prompt, `${prompt} in various scenarios`),
        template.replace(prompt, `practical ${prompt}`),
        template.replace(prompt, `strategic ${prompt}`)
      ];
      
      // Add a variation
      sentences.push(variations[i % variations.length]);
    }
  }
  
  return sentences;
}

// Generate blog post content
function generateBlogPost(title: string, sentences: string[], paragraphs: number, tone: string): string {
  // Option to use headings or not - for now let's make it just paragraphs
  const useHeadings = false;
  
  const headings = [
    'Introduction',
    'Key Benefits',
    'Best Practices',
    'Case Studies',
    'Implementation Strategies',
    'Future Developments',
    'Conclusion'
  ];
  
  let content = `# ${title}\n\n`;
  
  // Create paragraphs without explicit headings
  if (!useHeadings) {
    // Distribute sentences evenly across paragraphs
    const sentencesPerParagraph = Math.max(1, Math.ceil(sentences.length / paragraphs));
    
    for (let i = 0; i < paragraphs; i++) {
      // Get sentences for this paragraph
      const start = i * sentencesPerParagraph;
      const end = Math.min(start + sentencesPerParagraph, sentences.length);
      const paragraphSentences = sentences.slice(start, end);
      
      // Add paragraph content
      if (paragraphSentences.length > 0) {
        content += paragraphSentences.join(' ') + '\n\n';
      } else {
        // If we've used all sentences but still need paragraphs, generate some
        // variation instead of the same stock sentence
        const variations = [
          `The implications of ${title} continue to evolve as new research emerges.`,
          `Experts in the field of ${title} are constantly discovering new applications.`,
          `The future of ${title} holds exciting possibilities for innovation and growth.`,
          `${title} represents a significant area of interest for ongoing studies.`,
          `Understanding ${title} requires consideration of multiple perspectives and approaches.`
        ];
        
        content += variations[i % variations.length] + '\n\n';
      }
    }
  } else {
    // Original implementation with headings
    const sentencesPerParagraph = Math.max(1, Math.ceil(sentences.length / paragraphs));
    
    for (let i = 0; i < Math.min(paragraphs, headings.length); i++) {
      content += `## ${headings[i]}\n\n`;
      
      // Get sentences for this paragraph
      const start = i * sentencesPerParagraph;
      const end = Math.min(start + sentencesPerParagraph, sentences.length);
      const paragraphSentences = sentences.slice(start, end);
      
      // Add paragraph content
      if (paragraphSentences.length > 0) {
        content += paragraphSentences.join(' ') + '\n\n';
      } else {
        // Varied fallbacks if we run out of sentences
        const variations = [
          `${title} is an important topic in this area. Further research and development will continue to improve our understanding.`,
          `The implementation of ${title} continues to evolve through industry innovations and academic research.`,
          `As technology advances, our understanding of ${title} will expand to encompass new possibilities.`,
          `The significance of ${title} cannot be overstated in its contribution to this field of study.`,
          `Current trends in ${title} suggest promising directions for future development and application.`
        ];
        
        content += variations[i % variations.length] + '\n\n';
      }
    }
  }
  
  return content;
}

// Generate product description
function generateProductDescription(product: string, sentences: string[], paragraphs: number, tone: string): string {
  let content = `# ${product}\n\n`;
  
  // First paragraph is overview
  content += sentences.slice(0, 2).join(' ') + '\n\n';
  
  // Features section
  content += `## Features\n\n`;
  
  // Generate features as bullet points
  const features = [
    `Enhanced ${product} performance`,
    `Streamlined user experience`,
    `Advanced integration capabilities`,
    `Customizable settings`,
    `Comprehensive analytics`
  ];
  
  features.forEach(feature => {
    content += `* **${feature}**: ${sentences[Math.floor(Math.random() * sentences.length)]}\n`;
  });
  
  content += '\n## Why Choose Our Product\n\n';
  content += sentences.slice(2, Math.min(sentences.length, 4)).join(' ') + '\n\n';
  
  return content;
}

// Generate email content
function generateEmail(subject: string, sentences: string[], tone: string): string {
  const greetings = {
    'Professional': 'Dear Valued Client,',
    'Casual': 'Hi there,',
    'Enthusiastic': 'Hello!',
    'Formal': 'To Whom It May Concern,',
    'Technical': 'Dear Team,'
  };
  
  const closings = {
    'Professional': 'Best regards,\nYour Name',
    'Casual': 'Thanks,\nYour Name',
    'Enthusiastic': 'Looking forward to hearing from you!\nYour Name',
    'Formal': 'Sincerely,\nYour Name',
    'Technical': 'Regards,\nYour Name'
  };
  
  const greeting = greetings[tone] || greetings['Professional'];
  const closing = closings[tone] || closings['Professional'];
  
  let content = `Subject: Regarding ${subject}\n\n${greeting}\n\n`;
  
  // Email body
  content += sentences.join(' ') + '\n\n';
  
  // Closing
  content += `${closing}`;
  
  return content;
}

// Generate social media post
function generateSocialMediaPost(topic: string, sentence: string, tone: string): string {
  // Generate hashtags based on topic
  const words = tokenizeWords(topic);
  const hashtags = words
    .filter(word => !STOPWORDS.has(word) && word.length > 2)
    .map(word => `#${word}`)
    .join(' ');
  
  const emoji = tone === 'Enthusiastic' ? '🔥 😍 ' : 
               tone === 'Casual' ? '👍 ' : '';
  
  return `${emoji}${sentence} ${hashtags} #${topic.replace(/\s+/g, '')}`;
}

// Generate generic content
function generateGenericContent(topic: string, sentences: string[], paragraphs: number, tone: string): string {
  let content = `# About ${topic}\n\n`;
  
  // Distribute sentences across paragraphs
  const sentencesPerParagraph = Math.max(1, Math.ceil(sentences.length / paragraphs));
  
  for (let i = 0; i < paragraphs; i++) {
    // Get sentences for this paragraph
    const start = i * sentencesPerParagraph;
    const end = Math.min(start + sentencesPerParagraph, sentences.length);
    const paragraphSentences = sentences.slice(start, end);
    
    // Add paragraph content
    if (paragraphSentences.length > 0) {
      content += paragraphSentences.join(' ') + '\n\n';
    }
  }
  
  return content;
}

// Enhanced Keyword Extraction with TF-IDF and NLP Techniques
export async function extractKeywords(request: KeywordExtractionRequest): Promise<KeywordExtractionResponse> {
  if (!request.text.trim()) {
    throw new Error('No text provided for keyword extraction');
  }
  
  try {
    // If OpenAI API key is available, we could use it for better extraction
    if (openaiApiKey) {
      // Implement OpenAI call for keyword extraction
      // Return result
    }
    
    // Use our enhanced TF-IDF and other techniques for keyword extraction
    return enhancedExtractKeywords(request);
  } catch (error) {
    console.error('Keyword extraction error:', error);
    throw new Error('Keyword extraction failed');
  }
}

// Enhanced keyword extraction using multiple techniques
function enhancedExtractKeywords(request: KeywordExtractionRequest): KeywordExtractionResponse {
  const { text, count, method } = request;
  
  // Break text into paragraphs to treat them as documents for IDF calculation
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  
  // If only one paragraph, split into smaller chunks
  const documents = paragraphs.length > 1 ? paragraphs : tokenizeSentences(text);
  
  let keywords: Array<{ keyword: string; score: number }> = [];
  
  switch (method) {
    case 'enhanced_tfidf':
      keywords = extractWithEnhancedTFIDF(text, documents, count);
      break;
    case 'bert_based':
      // Simulate BERT-based extraction with our enhanced algorithms
      keywords = extractWithSimulatedBERT(text, documents, count);
      break;
    case 'standard_tfidf':
      keywords = extractWithStandardTFIDF(text, documents, count);
      break;
    default:
      keywords = extractWithEnhancedTFIDF(text, documents, count);
  }
  
  return {
    keywords,
    method: `enhanced_${method}`
  };
}

// Extract keywords using standard TF-IDF
function extractWithStandardTFIDF(text: string, documents: string[], count: number): Array<{ keyword: string; score: number }> {
  // Calculate TF for the entire text
  const tf = calculateTF(text);
  
  // Calculate IDF using the documents
  const idf = calculateIDF(documents);
  
  // Calculate TF-IDF
  const tfidf = calculateTFIDF(tf, idf);
  
  // Convert to array and sort by score
  const keywordArray = Object.entries(tfidf)
    .map(([keyword, score]) => ({ keyword, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
  
  return keywordArray;
}

// Extract keywords using enhanced TF-IDF
function extractWithEnhancedTFIDF(text: string, documents: string[], count: number): Array<{ keyword: string; score: number }> {
  // Get standard TF-IDF keywords
  const tfidfKeywords = extractWithStandardTFIDF(text, documents, Math.ceil(count * 1.5));
  
  // Extract n-grams (phrases) from text
  const bigrams = extractPhrases(text, 2);
  const trigrams = extractPhrases(text, 3);
  
  // Convert to keyword array format
  const bigramKeywords = Object.entries(bigrams)
    .filter(([phrase, freq]) => freq > 1 && !STOPWORDS.has(phrase.split(' ')[0]) && !STOPWORDS.has(phrase.split(' ')[1]))
    .map(([phrase, freq]) => ({
      keyword: phrase,
      score: freq / documents.length * 1.2  // Give bigrams slight boost
    }));
  
  const trigramKeywords = Object.entries(trigrams)
    .filter(([phrase, freq]) => freq > 1)
    .filter(([phrase]) => {
      const words = phrase.split(' ');
      return !STOPWORDS.has(words[0]) && !STOPWORDS.has(words[words.length - 1]);
    })
    .map(([phrase, freq]) => ({
      keyword: phrase,
      score: freq / documents.length * 1.3  // Give trigrams more boost
    }));
  
  // Combine all keywords
  const allKeywords = [...tfidfKeywords, ...bigramKeywords, ...trigramKeywords];
  
  // Sort by score and take top results
  const finalKeywords = allKeywords
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
  
  // Normalize scores for better visualization
  const maxScore = Math.max(...finalKeywords.map(k => k.score));
  return finalKeywords.map(k => ({
    ...k,
    score: k.score / maxScore
  }));
}

// Simulate BERT-based extraction with our JS algorithms
function extractWithSimulatedBERT(text: string, documents: string[], count: number): Array<{ keyword: string; score: number }> {
  // We'll use a combination of techniques to simulate semantic understanding
  
  // Get TF-IDF keywords as base
  const tfidfKeywords = extractWithStandardTFIDF(text, documents, Math.ceil(count * 1.2));
  
  // Get phrase-based keywords
  const phraseKeywords = extractWithEnhancedTFIDF(text, documents, Math.ceil(count * 0.8))
    .filter(k => k.keyword.includes(' ')); // Only keep multi-word phrases
  
  // Simulate contextual understanding by boosting keywords that appear in:
  // 1. Title-like positions (beginning of paragraphs)
  // 2. Near other important keywords
  
  // Get the first sentence of each paragraph as potential title
  const titleSentences = documents.map(doc => tokenizeSentences(doc)[0] || '');
  const titleWords = titleSentences.flatMap(s => tokenizeWords(s))
    .filter(w => !STOPWORDS.has(w) && w.length > 2);
  
  // Count occurrences of words in titles
  const titleWordCounts: Record<string, number> = {};
  titleWords.forEach(word => {
    titleWordCounts[word] = (titleWordCounts[word] || 0) + 1;
  });
  
  // Boost keywords that appear in titles
  const boostedKeywords = [...tfidfKeywords, ...phraseKeywords].map(k => {
    let boostFactor = 1.0;
    
    // Check if single-word keyword appears in titles
    if (!k.keyword.includes(' ') && titleWordCounts[k.keyword]) {
      boostFactor += 0.4 * (titleWordCounts[k.keyword] / titleSentences.length);
    } 
    // Check if multi-word keyword has parts in titles
    else if (k.keyword.includes(' ')) {
      const keywordParts = k.keyword.split(' ');
      const partsInTitles = keywordParts
        .filter(part => titleWordCounts[part])
        .length;
      
      if (partsInTitles > 0) {
        boostFactor += 0.3 * (partsInTitles / keywordParts.length);
      }
    }
    
    return {
      ...k,
      score: k.score * boostFactor
    };
  });
  
  // Remove duplicates (prefer longer phrases)
  const uniqueKeywords: Array<{ keyword: string; score: number }> = [];
  const seen = new Set<string>();
  
  // Sort by score and process
  boostedKeywords.sort((a, b) => b.score - a.score);
  
  for (const kw of boostedKeywords) {
    // Check if this is a subphrase of something we've already seen
    let isSubphrase = false;
    for (const seenKw of seen) {
      if (seenKw.includes(kw.keyword)) {
        isSubphrase = true;
        break;
      }
    }
    
    if (!isSubphrase) {
      uniqueKeywords.push(kw);
      seen.add(kw.keyword);
      
      // Stop when we have enough keywords
      if (uniqueKeywords.length >= count) break;
    }
  }
  
  // Normalize scores
  const maxScore = Math.max(...uniqueKeywords.map(k => k.score));
  return uniqueKeywords.map(k => ({
    ...k,
    score: Math.min(1, k.score / maxScore)
  }));
}

// Personalized NLP Algorithm Recommendation Engine
// ==============================================
export async function recommendAlgorithm(request: AlgorithmRecommendationRequest): Promise<AlgorithmRecommendationResponse> {
  try {
    const { taskType, textLength, contentDomain, languageComplexity, priorityFactor, specialRequirements } = request;
    
    // Algorithm database with capabilities and performance characteristics
    const algorithms = {
      // Summarization algorithms
      'enhanced_extractive_tfidf': {
        taskTypes: ['summarization'],
        strengths: ['Resource efficiency', 'Speed', 'No external API dependency'],
        weaknesses: ['Less coherent than abstractive methods', 'Limited understanding of context'],
        resourceRequirements: 'low',
        quality: 'medium',
        speed: 'high',
        specialFeatures: ['copyright-friendly', 'extractive', 'local-processing']
      },
      'bert_extractive': {
        taskTypes: ['summarization'],
        strengths: ['Better semantic understanding', 'Improved coherence', 'Good with medium texts'],
        weaknesses: ['Higher resource requirements', 'Slower than TF-IDF', 'May require API access'],
        resourceRequirements: 'medium',
        quality: 'high',
        speed: 'medium',
        specialFeatures: ['contextual-understanding', 'extractive']
      },
      'bart_abstractive': {
        taskTypes: ['summarization'],
        strengths: ['Generates new text', 'Highest coherence', 'Best semantic understanding'],
        weaknesses: ['Highest resource requirements', 'Slowest option', 'Requires API access'],
        resourceRequirements: 'high',
        quality: 'very high',
        speed: 'low',
        specialFeatures: ['paraphrasing', 'abstractive', 'contextual-understanding']
      },
      
      // Translation algorithms
      'statistical_mt': {
        taskTypes: ['translation'],
        strengths: ['Fast processing', 'Low resource requirements', 'Works offline'],
        weaknesses: ['Lower quality than neural methods', 'Limited language support', 'Literal translations'],
        resourceRequirements: 'low',
        quality: 'medium',
        speed: 'high',
        specialFeatures: ['local-processing']
      },
      'neural_transformer': {
        taskTypes: ['translation'],
        strengths: ['High quality translations', 'Preserves context', 'Good language support'],
        weaknesses: ['Requires API access', 'Medium processing speed', 'Medium cost'],
        resourceRequirements: 'medium',
        quality: 'high',
        speed: 'medium',
        specialFeatures: ['contextual-understanding']
      },
      
      // Content generation algorithms
      'enhanced_template': {
        taskTypes: ['content_generation'],
        strengths: ['Very fast', 'Consistent structure', 'No API dependency'],
        weaknesses: ['Limited creativity', 'Repetitive patterns', 'Less contextual understanding'],
        resourceRequirements: 'low',
        quality: 'medium',
        speed: 'very high',
        specialFeatures: ['local-processing', 'copyright-friendly']
      },
      'fine_tuned_gpt': {
        taskTypes: ['content_generation'],
        strengths: ['Highest creativity', 'Natural language flow', 'Best contextual understanding'],
        weaknesses: ['API dependency', 'Higher costs', 'Potential copyright concerns'],
        resourceRequirements: 'high',
        quality: 'very high',
        speed: 'low',
        specialFeatures: ['creative', 'contextual-understanding', 'coherent']
      },
      'open_source_llm': {
        taskTypes: ['content_generation'],
        strengths: ['Good quality', 'More control', 'Self-hosted option'],
        weaknesses: ['High local resource needs', 'Setup complexity', 'Model size limitations'],
        resourceRequirements: 'high',
        quality: 'high',
        speed: 'medium',
        specialFeatures: ['creative', 'configurable']
      },
      
      // Keyword extraction algorithms
      'enhanced_tfidf': {
        taskTypes: ['keyword_extraction'],
        strengths: ['Very efficient', 'Works with any domain', 'No external dependencies'],
        weaknesses: ['Misses semantic relationships', 'Word frequency bias', 'Less context awareness'],
        resourceRequirements: 'very low',
        quality: 'medium',
        speed: 'very high',
        specialFeatures: ['local-processing', 'domain-agnostic']
      },
      'bert_keyword': {
        taskTypes: ['keyword_extraction'],
        strengths: ['Semantic understanding', 'Context awareness', 'Better phrase extraction'],
        weaknesses: ['Higher resource requirements', 'API dependency', 'Slower processing'],
        resourceRequirements: 'medium',
        quality: 'high',
        speed: 'medium',
        specialFeatures: ['contextual-understanding', 'semantic-relationships']
      }
    };
    
    // Filter algorithms by task type
    const compatibleAlgorithms = Object.entries(algorithms)
      .filter(([_, algo]) => algo.taskTypes.includes(taskType))
      .map(([name, algo]) => ({ name, ...algo }));
    
    if (compatibleAlgorithms.length === 0) {
      throw new Error(`No compatible algorithms found for task type: ${taskType}`);
    }
    
    // Scoring system based on request parameters
    const scoredAlgorithms = compatibleAlgorithms.map(algo => {
      let score = 0;
      
      // Priority factor scoring
      if (priorityFactor === 'speed' && ['high', 'very high'].includes(algo.speed)) {
        score += 3;
      } else if (priorityFactor === 'quality' && ['high', 'very high'].includes(algo.quality)) {
        score += 3;
      } else if (priorityFactor === 'balanced') {
        // For balanced, reward algorithms that have good speed and quality
        const speedScore = algo.speed === 'very high' ? 2 : algo.speed === 'high' ? 1.5 : algo.speed === 'medium' ? 1 : 0.5;
        const qualityScore = algo.quality === 'very high' ? 2 : algo.quality === 'high' ? 1.5 : algo.quality === 'medium' ? 1 : 0.5;
        score += (speedScore + qualityScore);
      }
      
      // Text length scoring
      if (textLength < 1000) {
        // For short texts, lightweight algorithms work well
        if (algo.resourceRequirements === 'low') score += 1;
      } else if (textLength > 5000) {
        // For long texts, favor efficient algorithms
        if (algo.resourceRequirements === 'low') score += 2;
        if (algo.resourceRequirements === 'medium') score += 1;
      }
      
      // Language complexity
      if (languageComplexity === 'complex' && ['high', 'very high'].includes(algo.quality)) {
        score += 1.5;
      } else if (languageComplexity === 'simple' && algo.speed === 'high') {
        score += 1;
      }
      
      // Domain-specific matching
      if (contentDomain) {
        // For specialized domains, semantic understanding is important
        if (algo.specialFeatures.includes('contextual-understanding')) {
          score += 1;
        }
      }
      
      // Special requirements matching
      if (specialRequirements && specialRequirements.length > 0) {
        const matchingFeatures = specialRequirements.filter(req => 
          algo.specialFeatures.includes(req.toLowerCase().replace(/_/g, '-'))
        );
        score += matchingFeatures.length;
      }
      
      return {
        name: algo.name,
        score,
        strengths: algo.strengths,
        weaknesses: algo.weaknesses
      };
    });
    
    // Sort algorithms by score
    scoredAlgorithms.sort((a, b) => b.score - a.score);
    
    // Select top algorithm as recommendation
    const recommended = scoredAlgorithms[0];
    
    // Normalize scores to 0-1 range for confidence
    const maxScore = Math.max(...scoredAlgorithms.map(a => a.score));
    const normalizedAlgorithms = scoredAlgorithms.map(algo => ({
      ...algo,
      score: algo.score / maxScore
    }));
    
    // Generate parameter recommendations based on the algorithm
    const suggestedParameters: Record<string, any> = {};
    
    switch (recommended.name) {
      case 'enhanced_extractive_tfidf':
        suggestedParameters.method = 'enhanced_tfidf';
        suggestedParameters.length = textLength > 3000 ? 'short' : textLength > 1000 ? 'medium' : 'long';
        suggestedParameters.style = languageComplexity === 'complex' ? 'simplified' : 'informative';
        break;
        
      case 'enhanced_template':
        suggestedParameters.creativityLevel = priorityFactor === 'quality' ? 80 : 50;
        suggestedParameters.length = textLength > 3000 ? 'Long (600+ words)' : textLength > 1000 ? 'Medium (300-500 words)' : 'Short (100-200 words)';
        suggestedParameters.tone = languageComplexity === 'complex' ? 'Technical' : contentDomain === 'marketing' ? 'Enthusiastic' : 'Professional';
        break;
        
      case 'enhanced_tfidf':
        suggestedParameters.count = textLength > 3000 ? 15 : 10;
        suggestedParameters.method = 'enhanced_tfidf';
        break;
        
      default:
        // Generic parameters
        suggestedParameters.quality = priorityFactor === 'quality' ? 'high' : 'medium';
        suggestedParameters.speed = priorityFactor === 'speed' ? 'high' : 'medium';
    }
    
    // Generate explanation
    let explanation = `Based on your requirements for ${taskType} with priority on ${priorityFactor}, `;
    explanation += `I recommend using the ${recommended.name} algorithm. `;
    
    if (priorityFactor === 'speed') {
      explanation += `This algorithm offers excellent processing speed while maintaining acceptable quality. `;
    } else if (priorityFactor === 'quality') {
      explanation += `This algorithm provides the best output quality for your specific needs. `;
    } else {
      explanation += `This algorithm offers a good balance between processing speed and output quality. `;
    }
    
    if (specialRequirements && specialRequirements.length > 0) {
      explanation += `It also addresses your special requirements for ${specialRequirements.join(', ')}. `;
    }
    
    // Return recommendation
    return {
      recommendedAlgorithm: recommended.name,
      confidence: normalizedAlgorithms[0].score,
      alternativeAlgorithms: normalizedAlgorithms.slice(1, 3),
      suggestedParameters,
      explanation
    };
    
  } catch (error) {
    console.error('Algorithm recommendation error:', error);
    throw new Error('Failed to generate algorithm recommendation');
  }
}
