const dbClient = require('../utils/dbclient');
const COLLECTION_NAME = 'consultations';

const SESSION_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

const isOlderThan24h = (date) => {
  if (!date) return true;
  const d = date instanceof Date ? date : new Date(date);
  return Date.now() - d.getTime() > SESSION_THRESHOLD_MS;
};

const upsertByPhoneNo = async (phone_no) => {
  try {
    const db = await dbClient(process.env.MONGODB_URI);
    const collection = db.collection(COLLECTION_NAME);
    const now = new Date();
    const _updateOp = await collection.updateOne(
      { phone_no: phone_no },
      { $set: { phone_no: phone_no, updated_at: now } },
      { upsert: true }
    );
    const result = await collection.findOne({ phone_no });
    return result;
  } catch (error) {
    throw error;
  }
};

/** Returns the latest consultation doc for this phone (by started_at or updated_at). */
const findLatestByPhoneNo = async (phone_no) => {
  const db = await dbClient(process.env.MONGODB_URI);
  const collection = db.collection(COLLECTION_NAME);
  const doc = await collection
    .find({ phone_no })
    .sort({ started_at: -1, updated_at: -1 })
    .limit(1)
    .next();
  return doc || null;
};

/** Creates a new consultation session (new conversation). */
const createOne = async (phone_no) => {
  try {
    const now = new Date();
    const db = await dbClient(process.env.MONGODB_URI);
    const collection = db.collection(COLLECTION_NAME);
    const result = await collection.insertOne({
      phone_no,
      started_at: now,
      updated_at: now,
      summary: '',
      status: 'active',
    });
    const doc = await collection.findOne({ _id: result.insertedId });
    return doc;
  } catch (error) {
    throw error;
  }
};

/**
 * Returns the current consultation session for this phone.
 * Starts a new session if: none exists, or last session was submitted to doctor, or last activity was >24h ago.
 */
const getCurrentOrCreate = async (phone_no) => {
  try {
    const doc = await findLatestByPhoneNo(phone_no);
    const shouldStartNew =
      !doc ||
      doc.status === 'submitted' ||
      isOlderThan24h(doc.started_at || doc.updated_at);
    if (shouldStartNew) {
      return await createOne(phone_no);
    }
    return doc;
  } catch (error) {
    throw error;
  }
};

const updateSummaryByPhoneNo = async (phone_no, summary) => {
  try {
    const now = new Date();
    const db = await dbClient(process.env.MONGODB_URI);
    const collection = db.collection(COLLECTION_NAME);
    const current = await getCurrentOrCreate(phone_no);
    await collection.updateOne(
      { _id: current._id },
      { $set: { summary, updated_at: now } }
    );
    const result = await collection.findOne({ _id: current._id });
    return result;
  } catch (error) {
    throw error;
  }
};

/** Marks the current consultation as submitted so the next message starts a new session. */
const markAsSubmitted = async (phone_no) => {
  try {
    const now = new Date();
    const db = await dbClient(process.env.MONGODB_URI);
    const collection = db.collection(COLLECTION_NAME);
    const current = await getCurrentOrCreate(phone_no);
    await collection.updateOne(
      { _id: current._id },
      { $set: { status: 'submitted', updated_at: now } }
    );
    const result = await collection.findOne({ _id: current._id });
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  upsertByPhoneNo,
  createOne,
  updateSummaryByPhoneNo,
  getCurrentOrCreate,
  findLatestByPhoneNo,
  markAsSubmitted,
};
