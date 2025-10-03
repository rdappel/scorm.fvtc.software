// Code Practice Form Handler
import EXAMPLES from './code-practice-examples.js';

// Helper function to get examples
const getExamples = () => EXAMPLES;

// Monaco language mapping
function getMonacoLanguage(language) {
	const languageMap = {
		'javascript': 'javascript',
		'python': 'python',
		'csharp': 'csharp',
		'java': 'java',
		'cpp': 'cpp',
		'php': 'php',
		'powershell': 'powershell'
	};
	return languageMap[language] || 'javascript';
}

// Auto-generate Object ID function (global scope)
function generateObjectId() {
	try {
		const courseTitle = document.getElementById('courseTitle').value.trim();
		const practiceTitle = document.getElementById('practiceTitle').value.trim();
		let objectId = '';

		if (courseTitle || practiceTitle) {
			// Create ID from course and practice titles
			objectId = (courseTitle + '-' + practiceTitle)
				.replace(/C#/g, 'csharp')
				.replace(/C\+\+/g, 'cpp')
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-+|-+$/g, '')
				.replace(/-+/g, '-');
		}

		const objectIdField = document.getElementById('objectId');
		if (objectIdField) {
			objectIdField.value = objectId;
			console.log('Generated object ID:', objectId);
		}
	} catch (error) {
		console.error('Error generating object ID:', error);
	}
}

// Variable insertion functions
function getVariableFormat(language, variable) {
	const formats = {
		'javascript': `/*{{${variable}}}*/`,
		'java': `/*{{${variable}}}*/`,
		'csharp': `/*{{${variable}}}*/`,
		'cpp': `/*{{${variable}}}*/`,
		'python': `#{{${variable}}}`,
		'php': `/*{{${variable}}}*/`,
		'powershell': `<#{{${variable}}}#>`
	};
	
	return formats[language] || `/*{{${variable}}}*/`;
}

function insertVariableIntoEditor(editorType, variable) {
	try {
		const languageSelect = document.getElementById('language');
		const currentLanguage = languageSelect ? languageSelect.value : 'javascript';
		
		let editor;
		if (editorType === 'config' && window.monacoConfigEditor) {
			editor = window.monacoConfigEditor;
		} else if (editorType === 'starting' && window.monacoStartingEditor) {
			editor = window.monacoStartingEditor;
		}
		
		if (!editor) {
			console.warn('Editor not found:', editorType);
			return;
		}
		
		// Get the formatted variable based on language
		const formattedVariable = getVariableFormat(currentLanguage, variable);
		
		// Get current cursor position
		const position = editor.getPosition();
		const range = new monaco.Range(
			position.lineNumber,
			position.column,
			position.lineNumber,
			position.column
		);
		
		// Insert the variable at cursor position
		editor.executeEdits('insert-variable', [{
			range: range,
			text: formattedVariable
		}]);
		
		// Set focus back to the editor and position cursor after inserted text
		editor.focus();
		const newPosition = new monaco.Position(
			position.lineNumber,
			position.column + formattedVariable.length
		);
		editor.setPosition(newPosition);
		
		console.log(`Inserted ${formattedVariable} into ${editorType} editor`);
	} catch (error) {
		console.error('Error inserting variable:', error);
	}
}

function insertTextIntoEditor(editorType, text) {
	try {
		let editor;
		if (editorType === 'config' && window.monacoConfigEditor) {
			editor = window.monacoConfigEditor;
		} else if (editorType === 'starting' && window.monacoStartingEditor) {
			editor = window.monacoStartingEditor;
		}
		
		if (!editor) {
			console.warn('Editor not found:', editorType);
			return;
		}
		
		// Get current cursor position
		const position = editor.getPosition();
		const range = new monaco.Range(
			position.lineNumber,
			position.column,
			position.lineNumber,
			position.column
		);
		
		// Insert the text at cursor position
		editor.executeEdits('insert-text', [{
			range: range,
			text: text
		}]);
		
		// Set focus back to the editor and position cursor after inserted text
		editor.focus();
		const newPosition = new monaco.Position(
			position.lineNumber,
			position.column + text.length
		);
		editor.setPosition(newPosition);
		
		console.log(`Inserted "${text}" into ${editorType} editor`);
	} catch (error) {
		console.error('Error inserting text:', error);
	}
}

// Improved Monaco loading with retry mechanism
let monacoLoadAttempts = 0;
const MAX_MONACO_ATTEMPTS = 10;

function waitForElement(selector, timeout = 5000) {
	return new Promise((resolve, reject) => {
		const element = document.querySelector(selector);
		if (element) {
			resolve(element);
			return;
		}

		const observer = new MutationObserver(() => {
			const element = document.querySelector(selector);
			if (element) {
				observer.disconnect();
				resolve(element);
			}
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true
		});

		setTimeout(() => {
			observer.disconnect();
			reject(new Error(`Element ${selector} not found within ${timeout}ms`));
		}, timeout);
	});
}

async function loadMonaco() {
	monacoLoadAttempts++;
	console.log(`Monaco load attempt ${monacoLoadAttempts}/${MAX_MONACO_ATTEMPTS}`);

	if (monacoLoadAttempts > MAX_MONACO_ATTEMPTS) {
		console.error('Max Monaco load attempts reached. Giving up.');
		alert('Failed to load code editors after multiple attempts. Please refresh the page.');
		return;
	}

	try {
		// Wait for required DOM elements
		await Promise.all([
			waitForElement('#monacoConfigCode'),
			waitForElement('#monacoStartingCode'),
			waitForElement('#language')
		]);

		console.log('Required DOM elements found, proceeding with Monaco setup');
	} catch (error) {
		console.warn('DOM elements not ready:', error.message);
		setTimeout(loadMonaco, 500);
		return;
	}

	// Check if require is available
	if (typeof require !== 'function') {
		console.log('Monaco require not available yet, retrying...');
		setTimeout(loadMonaco, 200);
		return;
	}

	try {
		require.config({
			paths: {
				'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@latest/min/vs'
			},
			'vs/nls': {
				availableLanguages: {
					'*': 'en'
				}
			}
		});

		require(['vs/editor/editor.main'], function () {
			try {
				initializeMonacoEditors();
			} catch (error) {
				console.error('Error in Monaco initialization:', error);
				setTimeout(loadMonaco, 1000);
			}
		}, function (error) {
			console.error('Failed to load Monaco modules:', error);
			setTimeout(loadMonaco, 1000);
		});

	} catch (error) {
		console.error('Error setting up Monaco require:', error);
		setTimeout(loadMonaco, 1000);
	}
}

function initializeMonacoEditors() {
	console.log('Initializing Monaco editors...');

	// Verify Monaco is available
	if (typeof monaco === 'undefined') {
		throw new Error('Monaco editor is not available');
	}

	// Check if editors are already created
	if (window.monacoConfigEditor && window.monacoStartingEditor) {
		console.log('Monaco editors already exist, skipping creation...');
		return;
	}

	// Dispose existing editors if they exist
	if (window.monacoConfigEditor) {
		window.monacoConfigEditor.dispose();
		window.monacoConfigEditor = null;
	}
	if (window.monacoStartingEditor) {
		window.monacoStartingEditor.dispose();
		window.monacoStartingEditor = null;
	}

	// Check for saved data first
	let savedData = null;
	try {
		const storedData = localStorage.getItem('codePracticeFormData');
		savedData = storedData ? JSON.parse(storedData) : null;
		console.log('Retrieved saved data:', savedData);
	} catch (e) {
		console.warn('Failed to load saved data:', e);
		savedData = null;
	}

	// Determine what code to load - all or nothing approach
	let configCode, startingCode;

	if (savedData) {
		// Use saved data completely (even if some fields are empty)
		configCode = savedData.configCode || '';
		startingCode = savedData.startingCode || '';
		console.log('Using saved data (all or nothing)');
	}

	console.log('Loading Monaco with:', {
		hasSavedData: !!savedData,
		configLength: configCode ? configCode.length : 0,
		startingLength: startingCode ? startingCode.length : 0,
		configIsEmpty: configCode === ''
	});

	// Verify DOM elements exist
	const configContainer = document.getElementById('monacoConfigCode');
	const startingContainer = document.getElementById('monacoStartingCode');
	const languageSelect = document.getElementById('language');

	if (!configContainer || !startingContainer || !languageSelect) {
		throw new Error('Required DOM elements not found');
	}

	// Create Monaco editors with proper error handling
	try {
		// Get the current language selection for syntax highlighting
		const currentLanguage = languageSelect.value || 'javascript';
		const monacoLanguage = getMonacoLanguage(currentLanguage);

		window.monacoConfigEditor = monaco.editor.create(configContainer, {
			value: configCode || '',
			language: monacoLanguage,
			theme: 'vs-light',
			minimap: { enabled: false },
			fontSize: 14,
			lineNumbers: 'on',
			automaticLayout: true,
			wordWrap: 'on',
			scrollBeyondLastLine: false
		});

		window.monacoStartingEditor = monaco.editor.create(startingContainer, {
			value: startingCode || '',
			language: monacoLanguage,
			theme: 'vs-light',
			minimap: { enabled: false },
			fontSize: 14,
			lineNumbers: 'on',
			automaticLayout: true,
			wordWrap: 'on',
			scrollBeyondLastLine: false
		});

		console.log('Monaco editors created successfully');

		// Reset attempt counter on success
		monacoLoadAttempts = 0;

	} catch (editorError) {
		console.error('Failed to create Monaco editors:', editorError);
		throw editorError;
	}

	try {
		// Call setupEventListeners after Monaco is ready
		setupEventListeners(savedData);

	} catch (error) {
		console.error('Error in initializeMonacoEditors:', error);
		throw error;
	}
}

function setupEventListeners(savedData) {
	// Attach event listeners with error handling
	try {
		const courseTitleField = document.getElementById('courseTitle');
		const practiceTitleField = document.getElementById('practiceTitle');

		if (courseTitleField) {
			courseTitleField.addEventListener('input', generateObjectId);
		}
		if (practiceTitleField) {
			practiceTitleField.addEventListener('input', generateObjectId);
		}

		console.log('Event listeners attached successfully');
	} catch (listenerError) {
		console.error('Failed to attach event listeners:', listenerError);
	}

	// Variable button event listeners
	try {
		const variableButtons = document.querySelectorAll('.var-btn');
		variableButtons.forEach(button => {
			button.addEventListener('click', function () {
				const editorType = this.dataset.editor;
				const variable = this.dataset.variable;
				
				// Extract just the variable name from the button text
				// Handle cases like "{{first_name}}" or "/*{{first_name}}*/"
				let variableName = variable;
				const match = variable.match(/\{\{([^}]+)\}\}/);
				if (match) {
					variableName = match[1];
				}
				
				// Special handling for non-variable buttons like TODO comments
				if (variable.includes('TODO')) {
					// Insert the exact text for TODO comments
					insertTextIntoEditor(editorType, variable);
				} else {
					// Insert formatted variable
					insertVariableIntoEditor(editorType, variableName);
				}
				
				// Visual feedback
				this.style.background = '#e6f3ff';
				setTimeout(() => {
					this.style.background = '#fff';
				}, 200);
			});
		});
		
		console.log(`Set up ${variableButtons.length} variable button listeners`);
	} catch (varButtonError) {
		console.error('Failed to attach variable button listeners:', varButtonError);
	}

	// Clear storage button handler
	const clearBtn = document.getElementById('clearBtn');
	if (clearBtn) {
		clearBtn.addEventListener('click', function () {
			if (confirm('Clear all saved work, form fields, and code editors? This cannot be undone!')) {
				localStorage.removeItem('codePracticeFormData');

				// Clear Monaco editors
				if (window.monacoConfigEditor && window.monacoStartingEditor) {
					window.monacoConfigEditor.setValue('');
					window.monacoStartingEditor.setValue('');
				}

				// Clear form fields too
				const fields = ['courseTitle', 'practiceTitle', 'objectId', 'language', 'instructions'];
				fields.forEach(fieldId => {
					const field = document.getElementById(fieldId);
					if (field) field.value = '';
				});

				const notice = document.getElementById('savedDataNotice');
				if (notice) notice.style.display = 'none';

				alert('All saved work, form fields, and code editors have been cleared!');
			}
		});
	}

	// Setup other Monaco-dependent event handlers here
	setupMonacoDependentHandlers(savedData);
}

function setupMonacoDependentHandlers(savedData) {
	// Export button handler
	const exportBtn = document.getElementById('exportBtn');
	if (exportBtn) {
		exportBtn.addEventListener('click', function () {
			try {
				// Get markdown version for export
				const instructionsField = document.getElementById('instructions');
				const instructionsMarkdownField = document.getElementById('instructionsMarkdown');
				
				let instructionsToExport = '';
				if (instructionsMarkdownField && instructionsMarkdownField.value) {
					// Use stored markdown if available
					instructionsToExport = instructionsMarkdownField.value;
				} else if (instructionsField && instructionsField.value) {
					// Use current textarea value
					instructionsToExport = instructionsField.value;
				}

				// Get current form data
				const formData = {
					courseTitle: document.getElementById('courseTitle').value,
					practiceTitle: document.getElementById('practiceTitle').value,
					objectId: document.getElementById('objectId').value,
					language: document.getElementById('language').value,
					instructions: instructionsToExport,
					configCode: window.monacoConfigEditor ? window.monacoConfigEditor.getValue() : '',
					startingCode: window.monacoStartingEditor ? window.monacoStartingEditor.getValue() : '',
					exportDate: new Date().toISOString(),
					version: '1.0'
				};

				// Generate filename using same convention as SCORM generation
				let filename = 'code-practice-export';
				if (formData.courseTitle && formData.practiceTitle) {
					filename = (formData.courseTitle + '-' + formData.practiceTitle)
						.replace(/C#/g, 'csharp')
						.replace(/C\+\+/g, 'cpp')
						.toLowerCase()
						.replace(/[^a-z0-9]+/g, '-')
						.replace(/^-+|-+$/g, '')
						.replace(/-+/g, '-');
				}
				filename += '.json';

				// Create and download JSON file
				const jsonString = JSON.stringify(formData, null, 2);
				const blob = new Blob([jsonString], { type: 'application/json' });
				const url = URL.createObjectURL(blob);

				const a = document.createElement('a');
				a.href = url;
				a.download = filename;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);

				console.log('Exported form data as:', filename);
			} catch (error) {
				console.error('Export failed:', error);
				alert('Failed to export data. Please try again.');
			}
		});
	}

	// Import button handler
	const importBtn = document.getElementById('importBtn');
	if (importBtn) {
		importBtn.addEventListener('click', function () {
			try {
				// Create file input element
				const fileInput = document.createElement('input');
				fileInput.type = 'file';
				fileInput.accept = '.json';
				fileInput.style.display = 'none';

				fileInput.addEventListener('change', function (event) {
					const file = event.target.files[0];
					if (!file) return;

					const reader = new FileReader();
					reader.onload = function (e) {
						try {
							const importedData = JSON.parse(e.target.result);

							// Validate imported data structure
							const requiredFields = ['courseTitle', 'practiceTitle', 'language', 'instructions'];
							const hasValidFields = requiredFields.some(field => importedData[field]);

							if (!hasValidFields) {
								alert('Invalid JSON file. The file does not contain valid form data.');
								return;
							}

							// Confirm import
							const confirmMessage = `Import data from JSON file?\n\nThis will replace all current form fields and code editors.\n\nFile contains:\n- Course: ${importedData.courseTitle || 'Not set'}\n- Practice: ${importedData.practiceTitle || 'Not set'}\n- Language: ${importedData.language || 'Not set'}`;

							if (confirm(confirmMessage)) {
								// Import form fields
								const formFields = ['courseTitle', 'practiceTitle', 'objectId', 'language'];
								formFields.forEach(fieldId => {
									const field = document.getElementById(fieldId);
									if (field && importedData[fieldId] !== undefined) {
										field.value = importedData[fieldId];
									}
								});

								// Handle instructions specially to support markdown
								const instructionsField = document.getElementById('instructions');
								const instructionsMarkdownField = document.getElementById('instructionsMarkdown');
								
								if (importedData.instructions !== undefined) {
									// The imported instructions should be markdown
									const markdownText = importedData.instructions;
									
									// Set the markdown in the visible field
									if (instructionsField) {
										instructionsField.value = markdownText;
									}
									
									// Store markdown in hidden field
									if (instructionsMarkdownField) {
										instructionsMarkdownField.value = markdownText;
									}
									
									// Update the preview if it exists
									const previewContainer = document.getElementById('instructionsPreview');
									if (previewContainer && typeof marked !== 'undefined' && markdownText.trim()) {
										previewContainer.innerHTML = marked.parse(markdownText);
									}
								}

								// Import Monaco editor content
								if (window.monacoConfigEditor && importedData.configCode !== undefined) {
									window.monacoConfigEditor.setValue(importedData.configCode);
								}
								if (window.monacoStartingEditor && importedData.startingCode !== undefined) {
									window.monacoStartingEditor.setValue(importedData.startingCode);
								}

								// Update language syntax highlighting
								if (importedData.language) {
									const languageSelect = document.getElementById('language');
									if (languageSelect) {
										languageSelect.dispatchEvent(new Event('change'));
									}
								}

								// Generate object ID from imported data
								generateObjectId();

								// Save imported data to localStorage
								saveFormData();

								alert('Data imported successfully!');
								console.log('Imported data:', importedData);
							}
						} catch (parseError) {
							console.error('Failed to parse JSON:', parseError);
							alert('Invalid JSON file. Please select a valid JSON export file.');
						}
					};

					reader.readAsText(file);
				});

				// Trigger file selection
				document.body.appendChild(fileInput);
				fileInput.click();
				document.body.removeChild(fileInput);

			} catch (error) {
				console.error('Import failed:', error);
				alert('Failed to import data. Please try again.');
			}
		});
	}

	// Language change handler
	const languageSelect = document.getElementById('language');
	if (languageSelect) {
		languageSelect.addEventListener('change', function () {
			const selectedLang = this.value;
			const monacoLang = getMonacoLanguage(selectedLang);

			if (window.monacoConfigEditor && window.monacoStartingEditor) {
				try {
					monaco.editor.setModelLanguage(window.monacoConfigEditor.getModel(), monacoLang);
					monaco.editor.setModelLanguage(window.monacoStartingEditor.getModel(), monacoLang);
					console.log(`Updated Monaco editor language to: ${monacoLang}`);
				} catch (langError) {
					console.error('Failed to set language:', langError);
				}
			}
		});
	}

	// Form submission
	const editorForm = document.getElementById('editorForm');
	if (editorForm) {
		editorForm.addEventListener('submit', function (e) {
			try {
				// Set hidden form values before submission
				const configCodeField = document.getElementById('configCode');
				const startingCodeField = document.getElementById('startingCode');
				const instructionsField = document.getElementById('instructions');
				const instructionsMarkdownField = document.getElementById('instructionsMarkdown');

				if (configCodeField && window.monacoConfigEditor) {
					configCodeField.value = window.monacoConfigEditor.getValue();
				}
				if (startingCodeField && window.monacoStartingEditor) {
					startingCodeField.value = window.monacoStartingEditor.getValue();
				}

				// Handle instructions: store markdown in hidden field, convert to HTML for SCORM
				if (instructionsField && instructionsMarkdownField) {
					const markdownText = instructionsField.value || '';
					
					// Always store the original markdown in the hidden field
					instructionsMarkdownField.value = markdownText;
					
					// Convert to HTML for SCORM generation (instructions field)
					if (markdownText.trim() && typeof marked !== 'undefined') {
						instructionsField.value = marked.parse(markdownText);
					}
					// If marked isn't available, send as-is (markdown will work fine)
				}

				// Save the current state (with markdown) to localStorage
				saveFormData();
			} catch (submitError) {
				console.error('Form submission error:', submitError);
			}
		});
	}

	// Restore saved form data if it exists
	if (savedData) {
		try {
			const savedDataNotice = document.getElementById('savedDataNotice');
			if (savedDataNotice) {
				savedDataNotice.style.display = 'block';
			}

			// Restore form fields only if they have saved values (preserve HTML defaults)
			const fieldsToRestore = {};

			if (savedData.courseTitle) fieldsToRestore.courseTitle = savedData.courseTitle;
			if (savedData.practiceTitle) fieldsToRestore.practiceTitle = savedData.practiceTitle;
			if (savedData.objectId) fieldsToRestore.objectId = savedData.objectId;
			if (savedData.language) fieldsToRestore.language = savedData.language;
			if (savedData.instructions) fieldsToRestore.instructions = savedData.instructions;

			Object.entries(fieldsToRestore).forEach(([fieldId, value]) => {
				const field = document.getElementById(fieldId);
				if (field) {
					field.value = value;
					console.log(`Restored ${fieldId}:`, value);
				}
			});

			// Trigger object ID generation after restoring data
			generateObjectId();

			// Update language if set
			if (savedData.language && languageSelect) {
				languageSelect.dispatchEvent(new Event('change'));
			}

			console.log('Form data restored successfully');
		} catch (restoreError) {
			console.error('Failed to restore form data:', restoreError);
		}
	} else {
		// No saved data, generate object ID from default values
		generateObjectId();
	}
}

// Save form data to localStorage
function saveFormData() {
	try {
		const fields = {
			courseTitle: document.getElementById('courseTitle'),
			practiceTitle: document.getElementById('practiceTitle'),
			objectId: document.getElementById('objectId'),
			language: document.getElementById('language'),
			instructions: document.getElementById('instructions'),
			instructionsMarkdown: document.getElementById('instructionsMarkdown')
		};

		// Save the markdown version for editing, not the HTML version
		let instructionsToSave = '';
		if (fields.instructionsMarkdown && fields.instructionsMarkdown.value) {
			// If we have markdown stored (after form submission), use that
			instructionsToSave = fields.instructionsMarkdown.value;
		} else if (fields.instructions && fields.instructions.value) {
			// Otherwise use the current textarea value (during editing)
			instructionsToSave = fields.instructions.value;
		}

		const formData = {
			courseTitle: fields.courseTitle ? fields.courseTitle.value : '',
			practiceTitle: fields.practiceTitle ? fields.practiceTitle.value : '',
			objectId: fields.objectId ? fields.objectId.value : '',
			language: fields.language ? fields.language.value : '',
			instructions: instructionsToSave,
			configCode: window.monacoConfigEditor ? window.monacoConfigEditor.getValue() : '',
			startingCode: window.monacoStartingEditor ? window.monacoStartingEditor.getValue() : ''
		};

		localStorage.setItem('codePracticeFormData', JSON.stringify(formData));
		console.log('Form data saved successfully');
	} catch (error) {
		console.error('Failed to save form data:', error);
	}
}

// Initialize when DOM is ready and module is loaded
let appInitialized = false;
function initializeApp() {
	if (appInitialized) {
		console.log('App already initialized, skipping...');
		return;
	}
	
	appInitialized = true;
	console.log('Initializing Code Practice app...');

	// Start Monaco loading process
	loadMonaco();

	// Set up other event listeners that don't depend on Monaco
	setupNonMonacoEventListeners();
}

function setupNonMonacoEventListeners() {
	// Auto-save every 30 seconds with better error handling
	setInterval(function () {
		try {
			const courseTitleField = document.getElementById('courseTitle');
			const practiceTitleField = document.getElementById('practiceTitle');

			if ((courseTitleField && courseTitleField.value.trim()) ||
				(practiceTitleField && practiceTitleField.value.trim()) ||
				(window.monacoStartingEditor && window.monacoStartingEditor.getValue().trim())) {
				saveFormData();
			}
		} catch (autoSaveError) {
			console.error('Auto-save failed:', autoSaveError);
		}
	}, 30000);

	// Example button handlers
	document.addEventListener('DOMContentLoaded', function () {
		const exampleButtons = document.querySelectorAll('.example-btn');
		exampleButtons.forEach(button => {
			button.addEventListener('click', function () {
				const language = this.dataset.language;
				const examples = getExamples();
				const example = examples[language];

				if (example) {
					// Populate form fields
					document.getElementById('courseTitle').value = example.courseTitle;
					document.getElementById('practiceTitle').value = example.practiceTitle;
					document.getElementById('language').value = example.language;
					document.getElementById('instructions').value = example.instructions;

					// Update Monaco editors if they're loaded
					if (window.monacoConfigEditor) {
						window.monacoConfigEditor.setValue(example.configCode);
						// Update language for syntax highlighting
						monaco.editor.setModelLanguage(
							window.monacoConfigEditor.getModel(),
							getMonacoLanguage(example.language)
						);
					}
					if (window.monacoStartingEditor) {
						window.monacoStartingEditor.setValue(example.startingCode);
						// Update language for syntax highlighting
						monaco.editor.setModelLanguage(
							window.monacoStartingEditor.getModel(),
							getMonacoLanguage(example.language)
						);
					}

					// Generate object ID using the global function
					generateObjectId();

					// Visual feedback
					this.style.background = '#4caf50';
					this.style.color = 'white';
					this.style.borderColor = '#4caf50';
					setTimeout(() => {
						this.style.background = 'white';
						this.style.color = '#495057';
						this.style.borderColor = '#dee2e6';
					}, 1000);

					console.log(`Loaded ${language} example successfully`);
				}
			});
		});
	});
}

// Multiple initialization strategies for better reliability
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initializeApp);
} else {
	// DOM is already ready
	initializeApp();
}

// Fallback for older browsers or timing issues
if (document.readyState === 'complete') {
	setTimeout(initializeApp, 100);
} else {
	window.addEventListener('load', function () {
		setTimeout(initializeApp, 100);
	});
}