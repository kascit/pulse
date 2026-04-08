import Log from "../models/Log.js";

/**
 * Write a log event for a resource action.
 * @param {string} userId
 * @param {object} resource - Must have _id, name, resourceType
 * @param {string} event - One of LOG_EVENTS
 * @param {string} message
 * @param {object} [metadata]
 */
export const record = async (userId, resource, event, message, metadata = null) => {
  try {
    await Log.create({
      userId,
      resourceId: resource._id,
      resourceName: resource.name,
      resourceType: resource.resourceType,
      event,
      message,
      metadata,
      timestamp: new Date(),
    });
  } catch (err) {
    // Log errors should never crash the main flow
    console.error("[logService] Failed to write log:", err.message);
  }
};
