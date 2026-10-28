import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

/**
 * Initialize Gemini client if API key is provided
 */
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Fallback AI enhancement when Gemini API Key is not set or network quota fails
 */
const heuristicImprovement = (post, userInstruction = '') => {
  const title = post.title || 'Untitled';
  const desc = post.description || '';
  const content = post.content || '';

  // Clean and enhance
  const capitalizedTitle = title.charAt(0).toUpperCase() + title.slice(1);
  const improvedTitle = capitalizedTitle.includes('AI')
    ? capitalizedTitle
    : `${capitalizedTitle} [Enhanced Edition]`;

  const improvedDescription = desc
    ? `${desc} (Polished with enhanced clarity, engagement, and tone).`
    : `An insightful exploration into ${title}, refined for optimal readability and impact.`;

  const formattedContent = `### Overview\n\n${content}\n\n---\n\n### Key Takeaways & Insights\n- **Clarity & Focus**: Enhanced narrative structure tailored for audience engagement.\n- **Depth**: Core concepts organized with contextual emphasis.\n\n*Refined through Akatsuki Draft Intelligence Engine${userInstruction ? ` | Instruction applied: "${userInstruction}"` : ''}*`;

  return {
    improvedTitle,
    improvedDescription,
    improvedContent: formattedContent,
    improvementSummary: 'Content structured with markdown headers, improved readability, key takeaways, and polished tone.',
    provider: 'Akatsuki Heuristic Fallback (Set GEMINI_API_KEY in .env for live Gemini 2.5 Flash)',
  };
};

/**
 * Improve post content using Google Gemini API or intelligent fallback
 * @param {Object} post - Original post object
 * @param {string} userInstruction - Optional user custom instruction
 * @param {Object} file - Optional uploaded file (image/pdf/document)
 */
export const improveContentWithGemini = async (post, userInstruction = '', file = null) => {
  const ai = getGeminiClient();

  if (!ai) {
    console.warn('[Gemini AI] No GEMINI_API_KEY detected. Using intelligent heuristic enhancement engine.');
    return heuristicImprovement(post, userInstruction);
  }

  try {
    const prompt = `You are an elite editorial AI assistant for Akatsuki's Draft, a premier content-sharing platform.
Your task is to take an existing post draft and significantly improve its quality, readability, vocabulary, structure, and audience engagement while preserving its core intent.

Original Post Details:
- Title: ${post.title}
- Description: ${post.description || 'None provided'}
- Category: ${post.category || 'General'}
- Content:
${post.content}

${userInstruction ? `Specific user improvement instruction: "${userInstruction}"` : ''}

Please respond ONLY with a valid, parseable JSON object matching this schema:
{
  "improvedTitle": "A catchy, polished, and professional title",
  "improvedDescription": "A compelling 1-2 sentence summary/meta description",
  "improvedContent": "The enhanced post content with clear markdown formatting (headings, bullet points, code blocks where appropriate, polished paragraphs)",
  "improvementSummary": "A concise 1-sentence explanation of what was enhanced"
}
Ensure there is NO leading or trailing text outside the JSON object. Do not wrap in markdown code blocks if possible, or use standard \`\`\`json.`;

    let contents = [prompt];

    // If an uploaded document/image was provided, incorporate it
    if (file && fs.existsSync(file.path)) {
      const mimeType = file.mimetype;
      const fileBuffer = fs.readFileSync(file.path);
      const base64Data = fileBuffer.toString('base64');

      contents = [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
    });

    const textOutput = response.text || '';
    
    // Parse JSON safely from Gemini response
    let cleanedText = textOutput.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```/, '').replace(/```$/, '').trim();
    }

    try {
      const parsed = JSON.parse(cleanedText);
      return {
        improvedTitle: parsed.improvedTitle || `${post.title} (AI Refined)`,
        improvedDescription: parsed.improvedDescription || post.description,
        improvedContent: parsed.improvedContent || post.content,
        improvementSummary: parsed.improvementSummary || 'Content polished with Gemini AI.',
        provider: 'Google Gemini 2.5 Flash',
      };
    } catch (parseErr) {
      console.warn('[Gemini AI] JSON parsing failed, using cleaned response text:', parseErr.message);
      return {
        improvedTitle: `${post.title} (AI Polished)`,
        improvedDescription: post.description || 'AI-refined version.',
        improvedContent: textOutput,
        improvementSummary: 'Content rewritten and polished using Gemini AI.',
        provider: 'Google Gemini 2.5 Flash',
      };
    }
  } catch (apiError) {
    console.error('[Gemini AI] Error calling Gemini API:', apiError.message);
    console.log('[Gemini AI] Falling back to intelligent heuristic enhancement.');
    const fallback = heuristicImprovement(post, userInstruction);
    fallback.error = apiError.message;
    return fallback;
  }
};
