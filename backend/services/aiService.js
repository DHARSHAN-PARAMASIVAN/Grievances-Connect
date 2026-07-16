const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini SDK if API key is provided
let genAI = null;
let model = null;

if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    console.log('Gemini AI Service initialized successfully.');
  } catch (error) {
    console.error('Error initializing Gemini AI SDK:', error.message);
  }
} else {
  console.warn('GEMINI_API_KEY not found in env. AI features will run in mock mode.');
}

/**
 * Summarizes grievance and analyzes sentiment/priority using Gemini API.
 */
const generateSummaryAndAnalysis = async (title, description) => {
  if (!model) {
    return {
      summary: 'Grievance submitted and pending review.',
      suggestedPriority: 'MEDIUM',
      sentiment: 'CONCERNED'
    };
  }

  const prompt = `
    Analyze this student grievance:
    Title: "${title}"
    Description: "${description}"

    Provide a JSON object containing:
    1. "summary": A concise, 1-sentence executive summary (maximum 15 words) suitable for a staff dashboard.
    2. "suggestedPriority": Estimate the priority based on urgency. Must be either "LOW", "MEDIUM", or "HIGH".
    3. "sentiment": A 1-word description of the student's emotional tone (e.g. "ANGRY", "FRUSTRATED", "ANXIOUS", "CONCERNED", "NEUTRAL").
    
    Ensure the response is strictly valid JSON matching these keys.
  `;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = result.response.text();
    return JSON.parse(responseText.trim());
  } catch (error) {
    console.warn(`[AI Warning] Gemini analysis failed (${error.message.includes('429') ? 'Quota Exceeded/Rate Limit' : error.message}). Using local fallback content.`);
    return {
      summary: description.slice(0, 80) + '...',
      suggestedPriority: 'MEDIUM',
      sentiment: 'CONCERNED'
    };
  }
};

/**
 * Generates an empathetic drafted response/resolution for staff.
 */
const generateResolutionDraft = async (title, description, category) => {
  if (!model) {
    return `Thank you for lodging your concern regarding ${category}. We have registered your grievance and assigned it to the respective staff. We will look into this matter immediately.`;
  }

  const prompt = `
    You are an AI support assistant for a college grievance redressal board.
    Draft a polite, empathetic, and action-oriented response template for college administration to reply to this student grievance:
    Title: "${title}"
    Description: "${description}"
    Category: "${category}"

    Suggest next steps or a logical path to resolution. Write in a tone that represents college officials. Do not use place-holders; keep it ready to be used or edited. Maximum 120 words.
  `;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.warn(`[AI Warning] Gemini drafting failed (${error.message.includes('429') ? 'Quota Exceeded/Rate Limit' : error.message}). Using local fallback template.`);
    return `We have received your grievance regarding ${category} and are actively reviewing it. A departmental representative will get in touch with you shortly to resolve this issue.`;
  }
};

module.exports = {
  generateSummaryAndAnalysis,
  generateResolutionDraft
};
