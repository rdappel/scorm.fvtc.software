/**
 * Shared string utility functions for SCORM services
 */

/**
 * Sanitizes an object ID by replacing non-alphanumeric characters with hyphens
 * and converting to lowercase
 * @param {string} objectId - The object ID to sanitize
 * @returns {string} The sanitized object ID
 */
export const sanitizeObjectId = (objectId) => {
	return objectId.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
}