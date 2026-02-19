const openaiHelper = require('../utils/openaiHelper');

/** Normalize agent output: ensure missing detail values are null, not the string "null". */
const normalizePatientDetails = (details) => {
  if (!details || typeof details !== 'object') return {};
  const out = {};
  for (const key of ['name', 'age', 'gender']) {
    const v = details[key];
    if (v !== undefined && v !== null && String(v).toLowerCase() !== 'null') {
      out[key] = v;
    }
  }
  return out;
};

const patientDetailsAgent = async (chatSummary, patientDetails) => {
  try {
    const context = `You help collect basic patient details for a friendly medical chat app.
INPUTS:
- chatSummary: Summary of the conversation so far.
- patientDetails: Already known details (may be empty).

REQUIRED: name, age, gender. Extract from chatSummary and merge with patientDetails.

RULES:
- For missing values use JSON null or omit the key. NEVER use the string "null" (e.g. never "name": "null").
- question: When details are incomplete, ask one warm, friendly question (e.g. "Hi! To help you better, could you share your name, age, and gender?" or "May I have your name, age, and gender?"). When complete, set question to null.

Output JSON only:
{
  "patientDetails": { "name": "value or omit if unknown", "age": "value or omit", "gender": "value or omit" },
  "isPatientDetailsComplete": true or false,
  "question": "friendly question" or null
}`;

    const message = `
chatSummary: ${chatSummary}
patientDetails: ${JSON.stringify(patientDetails || {})}`;

    const openaiRes = await openaiHelper(context, message);
    if (openaiRes) {
      openaiRes.patientDetails = normalizePatientDetails(
        openaiRes.patientDetails || {}
      );
      return openaiRes;
    }
    return {};
  } catch (error) {
    throw error;
  }
};

module.exports = patientDetailsAgent;
