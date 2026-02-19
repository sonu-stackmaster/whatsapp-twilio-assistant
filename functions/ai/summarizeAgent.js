const openaiHelper = require('../utils/openaiHelper');
const summarizeChat = async (
  lastSummary,
  lastMsg,
  userType,
  patientDetails
) => {
  try {
    const context = `You summarize conversations for a clinical chat app. Focus on what matters for the doctor: reason for visit, symptoms, severity, duration, and any other medical details. Use clear medical wording.
  Inputs:
  - previousSummary: earlier conversation summary
  - patientDetails: name, age, gender (for context only)
  - user message: the patient's latest message

  Merge the previous summary with the new message. Keep the summary concise and symptom-focused. Include patient demographics once (e.g. "Patient: name, age, gender") then focus on chief complaint and symptoms. Do not repeat "name, age, male" in every sentence.
  previousSummary: ${lastSummary},
  patientDetails: ${JSON.stringify(patientDetails)},
  Output JSON only: { "summary": "your concise summary" }
  `;
    const openaiRes = await openaiHelper(context, lastMsg);
    if (openaiRes && openaiRes.summary) {
      return openaiRes.summary;
    }
    return '';
  } catch (error) {
    throw error;
  }
};

module.exports = summarizeChat;
