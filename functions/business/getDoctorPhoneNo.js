const doctorService = require('../services/doctor');
const chooseDoctorAgent = require('../ai/chooseDoctorAgent');

// Default doctor (Nilesh) when none is chosen from DB
const DEFAULT_DOCTOR_PHONE = '919599138388';

const getDoctorPhoneNo = async (chatSummary) => {
  try {
    const allDoctors = await doctorService.getAllDoctor();
    if (allDoctors && allDoctors.length > 0) {
      const agentRes = await chooseDoctorAgent(chatSummary, allDoctors);
      console.log({ agentRes });
      if (agentRes && agentRes.phone_no) {
        return agentRes.phone_no;
      }
    }
    return DEFAULT_DOCTOR_PHONE; // Doctor Nilesh
  } catch (error) {
    throw error;
  }
};

module.exports = getDoctorPhoneNo;
