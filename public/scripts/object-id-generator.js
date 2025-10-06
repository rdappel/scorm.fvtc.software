// Shared Object ID Generation Module
// Used by both code-practice and lesson generators

/**
 * Generates a unique object ID based on title fields
 * @param {string} primaryTitle - Course title or main title
 * @param {string} secondaryTitle - Practice/lesson title or secondary title
 * @returns {string} Generated object ID
 */
export function generateObjectId(primaryTitle = '', secondaryTitle = '') {
	try {
		let objectId = '';

		if (primaryTitle || secondaryTitle) {
			// Create ID from titles
			objectId = (primaryTitle + '-' + secondaryTitle)
				.replace(/C#/g, 'csharp')
				.replace(/C\+\+/g, 'cpp')
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-+|-+$/g, '')
				.replace(/-+/g, '-');
		}

		return objectId;
	} catch (error) {
		console.error('Error generating object ID:', error);
		return '';
	}
}

/**
 * Auto-updates the objectId field based on form inputs
 * @param {string} primaryFieldId - ID of the primary title field
 * @param {string} secondaryFieldId - ID of the secondary title field
 * @param {string} objectIdFieldId - ID of the object ID field (default: 'objectId')
 */
export function updateObjectIdField(primaryFieldId, secondaryFieldId, objectIdFieldId = 'objectId') {
	try {
		const primaryField = document.getElementById(primaryFieldId);
		const secondaryField = document.getElementById(secondaryFieldId);
		const objectIdField = document.getElementById(objectIdFieldId);

		if (!primaryField || !secondaryField || !objectIdField) {
			console.warn('One or more required fields not found for object ID generation');
			return;
		}

		const primaryTitle = primaryField.value.trim();
		const secondaryTitle = secondaryField.value.trim();
		
		const objectId = generateObjectId(primaryTitle, secondaryTitle);
		objectIdField.value = objectId;
		
		console.log('Generated object ID:', objectId);
	} catch (error) {
		console.error('Error updating object ID field:', error);
	}
}

/**
 * Sets up automatic object ID generation for form fields
 * @param {string} primaryFieldId - ID of the primary title field
 * @param {string} secondaryFieldId - ID of the secondary title field
 * @param {string} objectIdFieldId - ID of the object ID field (default: 'objectId')
 */
export function setupAutoObjectIdGeneration(primaryFieldId, secondaryFieldId, objectIdFieldId = 'objectId') {
	document.addEventListener('DOMContentLoaded', () => {
		const primaryField = document.getElementById(primaryFieldId);
		const secondaryField = document.getElementById(secondaryFieldId);

		if (primaryField && secondaryField) {
			// Update object ID when either field changes
			const updateHandler = () => updateObjectIdField(primaryFieldId, secondaryFieldId, objectIdFieldId);
			
			primaryField.addEventListener('input', updateHandler);
			secondaryField.addEventListener('input', updateHandler);
			
			// Generate initial object ID if fields have values
			updateHandler();
		}
	});
}