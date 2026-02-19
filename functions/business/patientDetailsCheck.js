const { isEqual } = require('lodash');
const patientService = require('../services/patient');
const patientDetailsAgent = require('../ai/patientDetailsAgent');

const patientDetailsCheck = async (chatSummary, patientDetails, phone_no) => {
  try {
    let updatedPatientDetails = {};
    const agentResponse = await patientDetailsAgent(
      chatSummary,
      patientDetails
    );
    const mergedDetails = {
      ...(patientDetails || {}),
      ...(agentResponse.patientDetails || {}),
    };
    if (!isEqual(patientDetails, mergedDetails)) {
      updatedPatientDetails = mergedDetails;
      await patientService.updatePatientDetailsByPhoneNo(
        phone_no,
        updatedPatientDetails
      );
    }
    const hasAll =
      mergedDetails.name && mergedDetails.age && mergedDetails.gender;
    return {
      ...agentResponse,
      patientDetails: mergedDetails,
      isPatientDetailsComplete: hasAll || agentResponse.isPatientDetailsComplete,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = patientDetailsCheck;
