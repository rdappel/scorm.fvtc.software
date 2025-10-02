
// Get configuration from window object (set by EJS template)
const config = window.CODE_PRACTICE_CONFIG || {};
const language = config.language || 'javascript';

// SCORM helper functions for instructor visibility
const getScormTime = () => {
	const now = new Date();
	return now.toISOString().replace('T', ' ').substr(0, 19);
};

const createSetInteraction = api => {
	return (id, type, response, result, description = '', commit = false) => {
		const index = api.LMSGetValue('cmi.interactions._count');
		const prefix = `cmi.interactions.${index}.`;

		const truthyResult = result === true ? 'correct' : result === false ? 'incorrect' : result || '';

		api.LMSSetValue(`${prefix}id`, `${id} (${getScormTime()})`);
		api.LMSSetValue(`${prefix}type`, type);
		api.LMSSetValue(`${prefix}student_response`, response);
		api.LMSSetValue(`${prefix}result`, truthyResult);
		api.LMSSetValue(`${prefix}description`, description);

		console.log(`[SCORM INTERACTION] ${id}: ${response} (${truthyResult})`);
		if (commit) api.LMSCommit('');
	};
};

// Piston API runner endpoint
const runnerEndpoint = 'https://emkc.org/api/v2/piston/execute';

// Code merging function - replaces student code placeholders in configuration
function mergeCodeWithConfig(configCode, studentCode) {
	// Get current language to handle language-specific issues
	const config = window.CODE_PRACTICE_CONFIG || {};
	const currentLanguage = config.language || 'javascript';
	
	// For PHP, strip opening and closing PHP tags from student code to prevent nesting issues
	let processedStudentCode = studentCode;
	if (currentLanguage === 'php') {
		// Remove opening PHP tags (<?php, <?, <?=)
		processedStudentCode = processedStudentCode.replace(/^\s*<\?(?:php)?(?:\s|=)?/gm, '');
		// Remove closing PHP tags (?>) 
		processedStudentCode = processedStudentCode.replace(/\?>\s*$/gm, '');
		// Clean up any remaining standalone closing tags
		processedStudentCode = processedStudentCode.replace(/\?>\s*/g, '');
		
		// Only log in development mode
		if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
			console.log('Stripped PHP tags from student code to prevent nesting');
		}
	}

	// Define possible placeholder patterns for different comment styles
	const placeholderPatterns = [
		// C-style comments (JavaScript, Java, C, C++, C#, PHP)
		/\/\*\{\{student_code\}\}\*\//g,  // /*{{student_code}}*/
		/\/\*\{\{code\}\}\*\//g,         // /*{{code}}*/
		/\/\*\s*STUDENT_CODE\s*\*\//g,   // /* STUDENT_CODE */
		/\/\*\s*INSERT_STUDENT_CODE_HERE\s*\*\//g, // /* INSERT_STUDENT_CODE_HERE */
		/\/\*@student\*\//g,             // /*@student*/

		// Hash comments (Python, PowerShell, Shell)
		/#\{\{student_code\}\}/g,        // #{{student_code}}
		/#\{\{code\}\}/g,               // #{{code}}
		/#\s*STUDENT_CODE/g,            // # STUDENT_CODE
		/#\s*INSERT_STUDENT_CODE_HERE/g, // # INSERT_STUDENT_CODE_HERE
		/#@student/g,                   // #@student

		// Double slash comments (JavaScript, Java, C, C++, C#, PHP)
		/\/\/\{\{student_code\}\}/g,    // //{{student_code}}
		/\/\/\{\{code\}\}/g,           // //{{code}}
		/\/\/\s*STUDENT_CODE/g,        // // STUDENT_CODE
		/\/\/\s*INSERT_STUDENT_CODE_HERE/g, // // INSERT_STUDENT_CODE_HERE
		/\/\/@student/g                 // //@student
	];

	let mergedCode = configCode;
	let placeholderFound = false;

	// Try each pattern until we find one that matches
	for (const pattern of placeholderPatterns) {
		if (pattern.test(configCode)) {
			mergedCode = configCode.replace(pattern, processedStudentCode.trim());
			placeholderFound = true;
			// Only log pattern info in development, keep it hidden from students
			if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
				console.log(`Configuration pattern found: ${pattern.source}`);
			}
			break;
		}
	}

	if (!placeholderFound) {
		// If no placeholder found, prepend configuration code to student code
		// This ensures instructor's setup code runs before student code
		mergedCode = configCode.trim() + '\n\n' + processedStudentCode.trim();

		// Only log in development mode
		if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
			console.log('No placeholder found - prepending configuration code to student code');
		}
	}

	// Apply template variables to the merged code
	mergedCode = applyTemplateVariables(mergedCode);

	return mergedCode;
}

// Pattern loading utilities
function loadScriptSync(src) {
	const script = document.createElement('script');
	script.src = src;
	script.async = false;
	document.head.appendChild(script);
	return new Promise((resolve, reject) => {
		script.onload = resolve;
		script.onerror = reject;
	});
}

function loadRequiredPatterns(language) {
	// Initialize TemplatePatterns namespace
	window.TemplatePatterns = window.TemplatePatterns || {};
	
	// First load the language mapping
	if (!window.LanguagePatterns) {
		const mappingScript = document.createElement('script');
		mappingScript.src = './patterns/language-mapping.js';
		mappingScript.async = false;
		document.head.appendChild(mappingScript);
	}
	
	// Wait for mapping to load, then load required patterns
	setTimeout(() => {
		if (window.getRequiredPatterns) {
			const requiredPatterns = window.getRequiredPatterns(language);
			
			requiredPatterns.forEach(patternName => {
				if (!window.TemplatePatterns[patternName === 'c-style' ? 'cStyle' : 
					patternName === 'double-slash' ? 'doubleSlash' : 
					patternName === 'powershell' ? 'powershellBlock' : patternName]) {
					
					const script = document.createElement('script');
					script.src = `./patterns/${patternName}.js`;
					script.async = false;
					document.head.appendChild(script);
				}
			});
		}
	}, 50); // Small delay to ensure mapping is loaded
}

// Synchronously ensure patterns are loaded for a specific language
function ensurePatternsLoaded(language) {
	// Initialize TemplatePatterns namespace with embedded patterns
	// This avoids SCORM CSP issues with dynamic script loading
	window.TemplatePatterns = window.TemplatePatterns || {};
	
	// Embed C-style patterns directly
	if (!window.TemplatePatterns.cStyle) {
		window.TemplatePatterns.cStyle = {
			// Basic variables
			date: /\/\*\{\{date\}\}\*\//g,
			time: /\/\*\{\{time\}\}\*\//g,
			datetime: /\/\*\{\{datetime\}\}\*\//g,
			timestamp: /\/\*\{\{timestamp\}\}\*\//g,
			year: /\/\*\{\{year\}\}\*\//g,
			month: /\/\*\{\{month\}\}\*\//g,
			day: /\/\*\{\{day\}\}\*\//g,
			// Student variables
			id: /\/\*\{\{id\}\}\*\//g,
			name: /\/\*\{\{name\}\}\*\//g,
			first_name: /\/\*\{\{first_name\}\}\*\//g,
			last_name: /\/\*\{\{last_name\}\}\*\//g,
			full_name: /\/\*\{\{full_name\}\}\*\//g,
			// Context variables
			course_title: /\/\*\{\{course_title\}\}\*\//g,
			practice_title: /\/\*\{\{practice_title\}\}\*\//g,
			object_id: /\/\*\{\{object_id\}\}\*\//g,
			language: /\/\*\{\{language\}\}\*\//g,
			// Dynamic variables
			random_number: /\/\*\{\{random_number\}\}\*\//g,
			random_word: /\/\*\{\{random_word\}\}\*\//g,
			uuid: /\/\*\{\{uuid\}\}\*\//g,
			attempt_count: /\/\*\{\{attempt_count\}\}\*\//g,
			session_time: /\/\*\{\{session_time\}\}\*\//g
		};
	}
	
	// Embed PowerShell patterns directly
	if (!window.TemplatePatterns.powershellBlock) {
		window.TemplatePatterns.powershellBlock = {
			// Basic variables
			date: /<#\{\{date\}\}#>/g,
			time: /<#\{\{time\}\}#>/g,
			datetime: /<#\{\{datetime\}\}#>/g,
			timestamp: /<#\{\{timestamp\}\}#>/g,
			year: /<#\{\{year\}\}#>/g,
			month: /<#\{\{month\}\}#>/g,
			day: /<#\{\{day\}\}#>/g,
			// Student variables
			id: /<#\{\{id\}\}#>/g,
			name: /<#\{\{name\}\}#>/g,
			first_name: /<#\{\{first_name\}\}#>/g,
			last_name: /<#\{\{last_name\}\}#>/g,
			full_name: /<#\{\{full_name\}\}#>/g,
			// Context variables
			course_title: /<#\{\{course_title\}\}#>/g,
			practice_title: /<#\{\{practice_title\}\}#>/g,
			object_id: /<#\{\{object_id\}\}#>/g,
			language: /<#\{\{language\}\}#>/g,
			// Dynamic variables
			random_number: /<#\{\{random_number\}\}#>/g,
			random_word: /<#\{\{random_word\}\}#>/g,
			uuid: /<#\{\{uuid\}\}#>/g,
			attempt_count: /<#\{\{attempt_count\}\}#>/g,
			session_time: /<#\{\{session_time\}\}#>/g
		};
	}
	
	// Embed hash patterns directly
	if (!window.TemplatePatterns.hash) {
		window.TemplatePatterns.hash = {
			// Basic variables
			date: /#\{\{date\}\}/g,
			time: /#\{\{time\}\}/g,
			datetime: /#\{\{datetime\}\}/g,
			timestamp: /#\{\{timestamp\}\}/g,
			year: /#\{\{year\}\}/g,
			month: /#\{\{month\}\}/g,
			day: /#\{\{day\}\}/g,
			// Student variables
			id: /#\{\{id\}\}/g,
			name: /#\{\{name\}\}/g,
			first_name: /#\{\{first_name\}\}/g,
			last_name: /#\{\{last_name\}\}/g,
			full_name: /#\{\{full_name\}\}/g,
			// Context variables
			course_title: /#\{\{course_title\}\}/g,
			practice_title: /#\{\{practice_title\}\}/g,
			object_id: /#\{\{object_id\}\}/g,
			language: /#\{\{language\}\}/g,
			// Dynamic variables
			random_number: /#\{\{random_number\}\}/g,
			random_word: /#\{\{random_word\}\}/g,
			uuid: /#\{\{uuid\}\}/g,
			attempt_count: /#\{\{attempt_count\}\}/g,
			session_time: /#\{\{session_time\}\}/g
		};
	}
	
	// Embed double-slash patterns directly
	if (!window.TemplatePatterns.doubleSlash) {
		window.TemplatePatterns.doubleSlash = {
			// Basic variables
			date: /\/\/\{\{date\}\}/g,
			time: /\/\/\{\{time\}\}/g,
			datetime: /\/\/\{\{datetime\}\}/g,
			timestamp: /\/\/\{\{timestamp\}\}/g,
			year: /\/\/\{\{year\}\}/g,
			month: /\/\/\{\{month\}\}/g,
			day: /\/\/\{\{day\}\}/g,
			// Student variables
			id: /\/\/\{\{id\}\}/g,
			name: /\/\/\{\{name\}\}/g,
			first_name: /\/\/\{\{first_name\}\}/g,
			last_name: /\/\/\{\{last_name\}\}/g,
			full_name: /\/\/\{\{full_name\}\}/g,
			// Context variables
			course_title: /\/\/\{\{course_title\}\}/g,
			practice_title: /\/\/\{\{practice_title\}\}/g,
			object_id: /\/\/\{\{object_id\}\}/g,
			language: /\/\/\{\{language\}\}/g,
			// Dynamic variables
			random_number: /\/\/\{\{random_number\}\}/g,
			random_word: /\/\/\{\{random_word\}\}/g,
			uuid: /\/\/\{\{uuid\}\}/g,
			attempt_count: /\/\/\{\{attempt_count\}\}/g,
			session_time: /\/\/\{\{session_time\}\}/g
		};
	}
}

// Apply template variables to code
function applyTemplateVariables(code) {
	// Get current language and ensure patterns are loaded
	const editorConfig = window.CODE_PRACTICE_CONFIG || {};
	const currentLanguage = editorConfig.language || 'javascript';
	
	// Ensure patterns are loaded synchronously for this language
	ensurePatternsLoaded(currentLanguage);
	
	// Get current date and time
	const now = new Date();
	const currentDate = now.toLocaleDateString();
	const currentTime = now.toLocaleTimeString();
	const currentDateTime = now.toLocaleString();
	const timestamp = Math.floor(now.getTime() / 1000);
	const year = now.getFullYear();
	const month = now.toLocaleDateString('en-US', { month: 'long' });
	const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });

	// Get SCORM student information
	const debugMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
	let studentId = 'student';
	let studentName = 'Student';
	let firstName = 'Student';
	let lastName = '';
	let fullName = 'Student';

	// Helper function to validate SCORM values
	const isValidValue = (val) => {
		if (!val) return false;
		if (val === 'false' || val === 'undefined' || val === '""' || val === "''") return false;
		if (val === 'null' || val === '[object Object]') return false;
		return true;
	};

	// Helper function to parse "Last, First" name format
	const parseStudentName = (nameString) => {
		if (!nameString || typeof nameString !== 'string') {
			return { firstName: 'Student', lastName: '', fullName: 'Student' };
		}

		const trimmedName = nameString.trim();
		
		// Check if name contains comma (Last, First format)
		if (trimmedName.includes(',')) {
			const parts = trimmedName.split(',').map(part => part.trim());
			const lastName = parts[0] || '';
			const firstName = parts[1] || '';
			const fullName = firstName && lastName ? `${firstName} ${lastName}` : trimmedName;
			
			return { firstName, lastName, fullName };
		} else {
			// No comma, assume it's already in "First Last" format or just one name
			const parts = trimmedName.split(' ').filter(part => part.length > 0);
			if (parts.length >= 2) {
				const firstName = parts[0];
				const lastName = parts.slice(1).join(' ');
				return { firstName, lastName, fullName: trimmedName };
			} else {
				// Single name, treat as first name
				return { firstName: trimmedName, lastName: '', fullName: trimmedName };
			}
		}
	};

	// Try to get student info directly from the SCORM API object itself
	try {
		// First check if our wrapper is initialized
		if (window.scormAPI && window.scormAPI.initialized) {
			console.log('Using SCORM API wrapper to get student data');
			
			// SCORM 1.2 uses different field names than 2004
			if (window.scormAPI.isScorm12) {
				// Use direct API calls with diagnostics
				console.log('Trying SCORM 1.2 fields...');
				
				// Get student ID
				const retrievedId = window.scormAPI.getValue('cmi.core.student_id');
				if (isValidValue(retrievedId)) {
					studentId = retrievedId;
					console.log(`Using SCORM student ID: "${studentId}"`);
				} else {
					console.log(`Invalid SCORM student ID: "${retrievedId}", using default: "${studentId}"`);
				}
				
				// Get student name and parse it
				const retrievedName = window.scormAPI.getValue('cmi.core.student_name');
				if (isValidValue(retrievedName)) {
					studentName = retrievedName;
					const parsedName = parseStudentName(retrievedName);
					firstName = parsedName.firstName;
					lastName = parsedName.lastName;
					fullName = parsedName.fullName;
					console.log(`Using SCORM student name: "${studentName}" -> First: "${firstName}", Last: "${lastName}", Full: "${fullName}"`);
				} else {
					console.log(`Invalid SCORM student name: "${retrievedName}", using defaults`);
				}
			} else {
				// SCORM 2004
				console.log('Trying SCORM 2004 fields...');
				
				// Get student ID
				const retrievedId = window.scormAPI.getValue('cmi.learner_id');
				if (isValidValue(retrievedId)) {
					studentId = retrievedId;
					console.log(`Using SCORM learner ID: "${studentId}"`);
				} else {
					console.log(`Invalid SCORM learner ID: "${retrievedId}", using default: "${studentId}"`);
				}
				
				// Get student name and parse it
				const retrievedName = window.scormAPI.getValue('cmi.learner_name');
				if (isValidValue(retrievedName)) {
					studentName = retrievedName;
					const parsedName = parseStudentName(retrievedName);
					firstName = parsedName.firstName;
					lastName = parsedName.lastName;
					fullName = parsedName.fullName;
					console.log(`Using SCORM learner name: "${studentName}" -> First: "${firstName}", Last: "${lastName}", Full: "${fullName}"`);
				} else {
					console.log(`Invalid SCORM learner name: "${retrievedName}", using defaults`);
				}
			}
			
			// Summary log for final values
			console.log('Final SCORM student data for templates:', { 
				id: studentId, 
				name: studentName, 
				firstName, 
				lastName, 
				fullName 
			});
			
		} else if (debugMode) {
			console.log('SCORM API wrapper not properly initialized. Checking for direct API access...');
			
			// Try to access the API directly as a fallback
			const directAPI = window.API || window.API_1484_11;
			if (directAPI) {
				console.log('Direct SCORM API found, attempting to retrieve student data...');
				
				// Try SCORM 1.2 fields first
				if (typeof directAPI.LMSGetValue === 'function') {
					console.log('Direct SCORM 1.2 API detected');
					try {
						const directId = directAPI.LMSGetValue('cmi.core.student_id');
						const directName = directAPI.LMSGetValue('cmi.core.student_name');
						
						if (isValidValue(directId)) studentId = directId;
						if (isValidValue(directName)) {
							studentName = directName;
							const parsedName = parseStudentName(directName);
							firstName = parsedName.firstName;
							lastName = parsedName.lastName;
							fullName = parsedName.fullName;
						}
						
						console.log('Direct SCORM 1.2 data retrieval:', { directId, directName, firstName, lastName, fullName });
					} catch (directError) {
						console.error('Error getting data from direct SCORM 1.2 API:', directError);
					}
				} 
				// Try SCORM 2004 fields
				else if (typeof directAPI.GetValue === 'function') {
					console.log('Direct SCORM 2004 API detected');
					try {
						const directId = directAPI.GetValue('cmi.learner_id');
						const directName = directAPI.GetValue('cmi.learner_name');
						
						if (isValidValue(directId)) studentId = directId;
						if (isValidValue(directName)) {
							studentName = directName;
							const parsedName = parseStudentName(directName);
							firstName = parsedName.firstName;
							lastName = parsedName.lastName;
							fullName = parsedName.fullName;
						}
						
						console.log('Direct SCORM 2004 data retrieval:', { directId, directName, firstName, lastName, fullName });
					} catch (directError) {
						console.error('Error getting data from direct SCORM 2004 API:', directError);
					}
				}
			} else {
				console.log('No SCORM API available - running in standalone mode');
			}
		}
	} catch (error) {
		// Fallback to defaults if SCORM data unavailable
		console.error('Error in SCORM student data retrieval:', error);
		// Keep the default values set above
	}
	

	// Get configuration context
	const config = window.CODE_PRACTICE_CONFIG || {};
	const courseTitle = config.courseTitle || 'Code Practice Course';
	const practiceTitle = config.practiceTitle || 'Assignment';
	const objectId = config.objectId || 'code-practice';
	const language = config.language || 'javascript';

	// Generate random values
	const randomNumber = Math.floor(Math.random() * 1000) + 1;
	const randomWords = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'theta', 'lambda', 'sigma', 'omega'];
	const randomWord = randomWords[Math.floor(Math.random() * randomWords.length)];
	const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		const r = Math.random() * 16 | 0;
		const v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});

	// Track attempt count (stored in sessionStorage to reset per session)
	const attemptKey = `attempt_count_${objectId}`;
	let attemptCount = parseInt(sessionStorage.getItem(attemptKey) || '0') + 1;
	sessionStorage.setItem(attemptKey, attemptCount.toString());

	// Calculate session time (from page load)
	const sessionStartTime = window.sessionStartTime || Date.now();
	const sessionTime = Math.floor((Date.now() - sessionStartTime) / 1000); // in seconds

	// Initialize template patterns object
	window.TemplatePatterns = window.TemplatePatterns || {};
	
	// Load template patterns synchronously (patterns should be pre-loaded)
	const templatePatterns = window.TemplatePatterns;

	// Replace template variables with all comment styles
	let processedCode = code;

	// DEBUG: Log the original code to see what we're starting with
	if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
		console.log('=== TEMPLATE VARIABLE DEBUG ===');
		console.log('Current language:', currentLanguage);
		console.log('Original code before any replacements:', processedCode);
		console.log('Available template patterns:', Object.keys(templatePatterns));
		console.log('Template pattern details:', templatePatterns);
		console.log('Student info:', { studentId, firstName, lastName, fullName });
		console.log('================================');
	}

	// Handle PowerShell block comments FIRST if PowerShell patterns are loaded
	if (templatePatterns.powershellBlock) {
		processedCode = processedCode
			// Basic variables
			.replace(templatePatterns.powershellBlock.date, currentDate)
			.replace(templatePatterns.powershellBlock.time, currentTime)
			.replace(templatePatterns.powershellBlock.datetime, currentDateTime)
			.replace(templatePatterns.powershellBlock.timestamp, timestamp.toString())
			.replace(templatePatterns.powershellBlock.year, year.toString())
			.replace(templatePatterns.powershellBlock.month, month)
			.replace(templatePatterns.powershellBlock.day, dayOfWeek)
			// Student variables
			.replace(templatePatterns.powershellBlock.id, studentId)
			.replace(templatePatterns.powershellBlock.name, studentName)
			.replace(templatePatterns.powershellBlock.first_name, firstName)
			.replace(templatePatterns.powershellBlock.last_name, lastName)
			.replace(templatePatterns.powershellBlock.full_name, fullName)
			// Context variables
			.replace(templatePatterns.powershellBlock.course_title, courseTitle)
			.replace(templatePatterns.powershellBlock.practice_title, practiceTitle)
			.replace(templatePatterns.powershellBlock.object_id, objectId)
			.replace(templatePatterns.powershellBlock.language, currentLanguage)
			// Dynamic variables
			.replace(templatePatterns.powershellBlock.random_number, randomNumber.toString())
			.replace(templatePatterns.powershellBlock.random_word, randomWord)
			.replace(templatePatterns.powershellBlock.uuid, uuid)
			.replace(templatePatterns.powershellBlock.attempt_count, attemptCount.toString())
			.replace(templatePatterns.powershellBlock.session_time, sessionTime.toString());

		// DEBUG: Log code after PowerShell replacements
		if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
			console.log('Code after PowerShell block comment replacements:', processedCode);
		}
	}

	// Build dynamic comment styles array based on loaded patterns
	const commentStyles = [];
	if (templatePatterns.cStyle) {
		commentStyles.push({ patterns: templatePatterns.cStyle, isComment: true, name: 'C-style' });
	}
	if (templatePatterns.hash) {
		commentStyles.push({ patterns: templatePatterns.hash, isComment: true, name: 'Hash' });
	}
	if (templatePatterns.doubleSlash) {
		commentStyles.push({ patterns: templatePatterns.doubleSlash, isComment: true, name: 'Double-slash' });
	}

	// Apply replacements for loaded comment styles
	commentStyles.forEach(({ patterns, isComment, name }) => {
		const beforeReplace = processedCode;
		
		// DEBUG: Log pattern processing
		if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
			console.log(`Processing ${name} patterns:`, patterns);
		}
		processedCode = processedCode
			// Basic variables - use raw values for comments, quoted for code
			.replace(patterns.date, isComment ? currentDate : `"${currentDate}"`)
			.replace(patterns.time, isComment ? currentTime : `"${currentTime}"`)
			.replace(patterns.datetime, isComment ? currentDateTime : `"${currentDateTime}"`)
			.replace(patterns.timestamp, timestamp.toString())
			.replace(patterns.year, year.toString())
			.replace(patterns.month, isComment ? month : `"${month}"`)
			.replace(patterns.day, isComment ? dayOfWeek : `"${dayOfWeek}"`)
			// Student variables
			.replace(patterns.id, isComment ? studentId : `"${studentId}"`)
			.replace(patterns.name, isComment ? studentName : `"${studentName}"`)
			.replace(patterns.first_name, isComment ? firstName : `"${firstName}"`)
			.replace(patterns.last_name, isComment ? lastName : `"${lastName}"`)
			.replace(patterns.full_name, isComment ? fullName : `"${fullName}"`)
			// Context variables
			.replace(patterns.course_title, isComment ? courseTitle : `"${courseTitle}"`)
			.replace(patterns.practice_title, isComment ? practiceTitle : `"${practiceTitle}"`)
			.replace(patterns.object_id, isComment ? objectId : `"${objectId}"`)
			.replace(patterns.language, isComment ? currentLanguage : `"${currentLanguage}"`)
			// Dynamic variables
			.replace(patterns.random_number, randomNumber.toString())
			.replace(patterns.random_word, isComment ? randomWord : `"${randomWord}"`)
			.replace(patterns.uuid, isComment ? uuid : `"${uuid}"`)
			.replace(patterns.attempt_count, attemptCount.toString())
			.replace(patterns.session_time, sessionTime.toString());
		
		// DEBUG: Log if any changes were made by this pattern set
		if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' && beforeReplace !== processedCode) {
			console.log(`Changes made by ${name} patterns:`, {
				before: beforeReplace.slice(0, 200) + '...',
				after: processedCode.slice(0, 200) + '...'
			});
		}
	});

	// Final debug log
	if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
		console.log('Final processed code:', processedCode);
	}

	return processedCode;
}

window.require = { paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs' } }
window.MonacoEnvironment = {
	getWorkerUrl: () =>
		`data:text/javascript;charset=utf-8,${encodeURIComponent(`
      self.MonacoEnvironment = { baseUrl: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/' }
      importScripts('https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/base/worker/workerMain.js')
    `)}`
}

// Track Monaco loading state
let monacoInitialized = false;
let monacoInitializing = false;

// Ensure DOM is ready before Monaco initialization
const ensureDOMReady = () => {
	return new Promise((resolve) => {
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', resolve, { once: true });
		} else {
			resolve();
		}
	});
};

// Robust Monaco loader with retry logic
const initializeMonaco = async () => {
	if (monacoInitialized || monacoInitializing) {
		console.log('Monaco already initialized or initializing');
		return;
	}
	
	monacoInitializing = true;
	console.log('Starting Monaco initialization...');
	
	try {
		// Ensure DOM is ready
		await ensureDOMReady();
		
		// Check if editor div exists
		const editorDiv = document.querySelector('#editor');
		if (!editorDiv) {
			console.error('Editor div not found, retrying in 500ms...');
			setTimeout(initializeMonaco, 500);
			monacoInitializing = false;
			return;
		}
		
		// Load Monaco with proper error handling
		await new Promise((resolve, reject) => {
			const loaderScript = document.createElement('script');
			loaderScript.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/loader.js';
			loaderScript.onload = () => {
				console.log('Monaco loader script loaded');
				resolve();
			};
			loaderScript.onerror = (error) => {
				console.error('Failed to load Monaco loader script:', error);
				reject(error);
			};
			
			// Set a timeout for loading
			setTimeout(() => {
				if (!loaderScript.onload.called) {
					reject(new Error('Monaco loader script timeout'));
				}
			}, 10000);
			
			document.head.appendChild(loaderScript);
		});
		
		// Load language extensions if needed
		if (language === 'csharp' || language === 'csharp.net') {
			await new Promise((resolve, reject) => {
				const csharpScript = document.createElement('script');
				csharpScript.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/basic-languages/csharp/csharp.js';
				csharpScript.onload = () => {
					console.log('C# language support loaded');
					resolve();
				};
				csharpScript.onerror = reject;
				document.head.appendChild(csharpScript);
			});
		}
		
		// Initialize Monaco editor
		initMonaco();
		
	} catch (error) {
		console.error('Monaco initialization failed:', error);
		monacoInitializing = false;
		
		// Retry after a delay
		setTimeout(() => {
			console.log('Retrying Monaco initialization...');
			initializeMonaco();
		}, 2000);
	}
};

// Start Monaco initialization when script loads
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initializeMonaco, { once: true });
} else {
	// DOM already loaded, start immediately but with a small delay to ensure everything is ready
	setTimeout(initializeMonaco, 100);
}

// UI value -> Monaco language id (syntax highlighting)
const LANGUAGE_MAP = {
	javascript: 'javascript',
	python: 'python',
	cpp: 'cpp',
	'c++': 'cpp',
	csharp: 'csharp',
	'csharp.net': 'csharp',
	php: 'php',
	powershell: 'shell' // Use shell highlighting for PowerShell
}

// UI value -> Piston runtime id (execution)
const PISTON_LANG = {
	javascript: 'javascript',
	python: 'python',
	'c++': 'cpp',
	'csharp.net': 'csharp.net',
	php: 'php',
	powershell: 'powershell',
	html: 'html',
	css: 'css'
}

// Choose a filename Piston expects for each runtime
const filenameFor = lang => {
	switch (lang) {
		case 'python': return 'main.py'
		case 'javascript': return 'index.js'
		case 'cpp': return 'main.cpp'
		case 'csharp.net': return 'Program.cs'
		case 'php': return 'index.php'
		case 'powershell': return 'script.ps1'
		default: return 'main.txt'
	}
}

// Run code via Piston, show compile + run output
const runCode = async ({ language, code, version }) => {
	const pistonLang = PISTON_LANG[language] || language
	const filename = filenameFor(pistonLang)

	// Merge configuration code with student code if config exists
	const config = window.CODE_PRACTICE_CONFIG || {};
	let finalCode = code;

	if (config.configCode && config.configCode.trim()) {
		finalCode = mergeCodeWithConfig(config.configCode, code);
		// Don't log the merged code to keep configuration hidden from students
		console.log('Configuration code applied (hidden from student view)');
	}

	const payload = {
		language: pistonLang,
		version: version || '*',
		files: [{ name: filename, content: finalCode }]
	}

	try {
		const res = await fetch(runnerEndpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		})
		const data = await res.json()

		console.log('Piston response:', data)

		const compileOut = `${data.compile?.stdout || ''}${data.compile?.stderr || ''}`.trim()
		const runOut = `${data.run?.stdout || ''}${data.run?.stderr || ''}`.trim()

		// Output selection logic
		const outputTypeSelect = document.getElementById('output-type')
		let outputType = outputTypeSelect?.value || 'instructions'
		let outputText = ''

		if (outputType === 'build') {
			outputText = compileOut || '(no build output)'
		} else if (outputType === 'program') {
			outputText = runOut || '(no program output)'
		} else {
			outputText = window.INSTRUCTIONS_TEXT || 'No instructions provided.'
		}

		// Update output display
		const outputDiv = document.getElementById('output')
		const instructionsDiv = document.getElementById('instructions')

		if (outputDiv) {
			outputDiv.textContent = outputText
			outputDiv.style.display = 'block'
		}

		// Hide instructions when showing output
		if (instructionsDiv && outputType !== 'instructions') {
			instructionsDiv.style.display = 'none'
		}

		// Store the result for potential later use
		window.lastRunData = data

		return data

	} catch (err) {
		const errorMessage = 'Error: ' + err.message
		const outputDiv = document.getElementById('output')
		const instructionsDiv = document.getElementById('instructions')

		if (outputDiv) {
			outputDiv.textContent = errorMessage
			outputDiv.style.display = 'block'
		}

		if (instructionsDiv) {
			instructionsDiv.style.display = 'none'
		}

		console.error('Code execution error:', err)
		throw err
	}
}

// Match #output colors to the actual Monaco theme at runtime
const syncOutputColors = editor => {
	const rootElement = document.documentElement
	const editorNode = editor.getDomNode()
	const bgDiv = editorNode.querySelector('.monaco-editor-background') || editorNode
	const fgDiv = editorNode.querySelector('.view-lines') || editorNode

	const bgColor = getComputedStyle(bgDiv).backgroundColor
	const fgColor = getComputedStyle(fgDiv).color

	rootElement.style.setProperty('--monaco-bg', bgColor)
	rootElement.style.setProperty('--monaco-fg', fgColor)
}

// Initialize Monaco and wire UI
const initMonaco = () => {
	if (monacoInitialized) {
		console.log('Monaco already initialized, skipping...');
		return;
	}
	
	console.log('Initializing Monaco editor...');
	
	try {
		require(['vs/editor/editor.main'], () => {
			console.log('Monaco editor main loaded');
			
			// Verify required DOM elements exist
			const runButton = document.querySelector('#run');
			const resetButton = document.querySelector('#reset');
			const submitButton = document.querySelector('#submit');
			const editorDiv = document.querySelector('#editor');

			if (!editorDiv) {
				console.error('Editor div not found! Retrying in 1 second...');
				monacoInitializing = false;
				setTimeout(initMonaco, 1000);
				return;
			}

			if (!runButton || !resetButton || !submitButton) {
				console.warn('Some UI buttons not found, but proceeding with editor initialization');
			}

			// Generate unique localStorage key from header
			const courseTitle = document.querySelector('.course-title')?.textContent?.trim() || 'course';
			const assignmentTitle = document.querySelector('.assignment-title')?.textContent?.trim() || 'assignment';
			const storageKey = `editor.code.${courseTitle.replace(/\s+/g, '_')}.${assignmentTitle.replace(/\s+/g, '_')}`;

			// Keyboard shortcuts: Ctrl+S to save, Ctrl+R to run
			document.addEventListener('keydown', e => {
				if (e.ctrlKey && e.key.toLowerCase() === 's') {
					e.preventDefault();
					if (window.monacoEditor) {
						localStorage.setItem(storageKey, window.monacoEditor.getValue());
					}
				}
				if (e.ctrlKey && e.key.toLowerCase() === 'r') {
					e.preventDefault();
					runButton?.click();
				}
			});

			// Run button loading animation logic (show/hide spinner/play icon)
			const setRunButtonLoading = isLoading => {
				const runButtonElement = document.getElementById('run');
				if (!runButtonElement) return;
				const playIconSpan = runButtonElement.querySelector('.play-icon');
				const spinnerSpan = runButtonElement.querySelector('.spinner');
				if (isLoading) {
					runButtonElement.disabled = true;
					runButtonElement.classList.add('loading');
					if (playIconSpan) playIconSpan.style.display = 'none';
					if (spinnerSpan) spinnerSpan.style.display = 'inline-block';
				} else {
					runButtonElement.disabled = false;
					runButtonElement.classList.remove('loading');
					if (spinnerSpan) spinnerSpan.style.display = 'none';
					if (playIconSpan) playIconSpan.style.display = 'inline-block';
				}
			};
			
			// Get starting code from configuration or use defaults
			const config = window.CODE_PRACTICE_CONFIG || {};
			let initialCode = config.startingCode;

			// Fallback to localStorage or default code if no starting code provided
			if (!initialCode) {
				initialCode = localStorage.getItem(storageKey);
				if (!initialCode) {
					const defaultPhp = `<?php\n// Default PHP code\necho 'Hello, world!';\n?>`;
					initialCode = language === 'php' ? defaultPhp : '\n\n\n';
				}
			}

			// Apply template variables to starting code
			if (initialCode) {
				initialCode = applyTemplateVariables(initialCode);
			}

			console.log('Creating Monaco editor instance...');
			
			// Create Monaco editor with error handling
			let editor;
			try {
				editor = monaco.editor.create(editorDiv, {
					value: initialCode,
					language: LANGUAGE_MAP[language] || 'javascript',
					theme: 'vs-dark',
					automaticLayout: true,
					minimap: { enabled: false },
					wordWrap: 'on',
					scrollBeyondLastLine: false,
					fontSize: 16
				});
				
				// Store editor globally for access
				window.monacoEditor = editor;
				monacoInitialized = true;
				console.log('Monaco editor created successfully');
				
			} catch (editorError) {
				console.error('Failed to create Monaco editor:', editorError);
				monacoInitializing = false;
				setTimeout(initMonaco, 2000);
				return;
			}

			// Ensure proper layout after creation
			requestAnimationFrame(() => {
				try {
					editor.layout();
					console.log('Monaco editor layout completed');
				} catch (layoutError) {
					console.error('Editor layout error:', layoutError);
				}
			});

			// Add click listener to focus editor
			editorDiv.addEventListener('mousedown', () => editor.focus());

			// Instructions text (customize as needed)
			const instructionsDiv = document.getElementById('instructions');

			const outputTypeSelect = document.getElementById('output-type');
			// Override handleRun to use unified runCode function and switch output to program
			const handleRunWithStore = async () => {
				localStorage.setItem(storageKey, editor.getValue());
				if (outputTypeSelect) outputTypeSelect.value = 'program';
				const outputDiv = document.getElementById('output');
				if (outputDiv) {
					outputDiv.style.display = 'block';
					outputDiv.textContent = '';
				}
				if (instructionsDiv) instructionsDiv.style.display = 'none';
				setRunButtonLoading(true);
				try {
					await runCode({ language, code: editor.getValue() });
				} finally {
					setRunButtonLoading(false);
				}
			};
			
			if (runButton) {
				runButton.addEventListener('click', handleRunWithStore);
			}
			
			// Initial instructions display
			const outputDiv = document.getElementById('output');
			if (outputDiv) outputDiv.style.display = 'none';
			if (instructionsDiv) instructionsDiv.style.display = 'block';
			if (outputTypeSelect) {
				outputTypeSelect.addEventListener('change', () => {
					if (outputTypeSelect.value === 'instructions') {
						if (outputDiv) outputDiv.style.display = 'none';
						if (instructionsDiv) instructionsDiv.style.display = 'block';
					} else {
						if (outputDiv) outputDiv.style.display = 'block';
						if (instructionsDiv) instructionsDiv.style.display = 'none';
						let outputText = '';
						if (outputTypeSelect.value === 'build') {
							if (window.lastRunData) {
								const compileOutput = `${window.lastRunData.compile?.stdout || ''}${window.lastRunData.compile?.stderr || ''}`.trim();
								outputText = compileOutput || '(no build output)';
							} else {
								outputText = '(no build output)';
							}
						} else if (outputTypeSelect.value === 'program') {
							if (window.lastRunData) {
								const runOutput = `${window.lastRunData.run?.stdout || ''}${window.lastRunData.run?.stderr || ''}`.trim();
								outputText = runOutput || '(no program output)';
							} else {
								outputText = '(no program output)';
							}
						}
						if (outputDiv) outputDiv.textContent = outputText;
					}
				});
			}

			// Reset button logic
			if (resetButton) {
				resetButton.addEventListener('click', () => {
					if (confirm('Are you sure you want to reset the code? You will lose all progress.')) {
						const config = window.CODE_PRACTICE_CONFIG || {};
						let originalCode = config.startingCode || '\n\n\n';

						// Apply template variables to the reset code
						originalCode = applyTemplateVariables(originalCode);

						editor.setValue(originalCode);
						localStorage.setItem(storageKey, originalCode);
						const outputElement = document.getElementById('output');
						if (outputElement) outputElement.textContent = '';
					}
				});
			}

			// Submit button logic
			if (submitButton) {
				submitButton.addEventListener('click', () => {
					if (confirm('Are you sure you want to submit your code for evaluation?')) {
						const code = editor.getValue();
						localStorage.setItem(storageKey, code);

						// Submit the code for evaluation and mark SCORM complete
						submitCode(code);
					}
				});
			}

			// Show submission count on page load if any previous submissions exist
			setTimeout(() => {
				const config = window.CODE_PRACTICE_CONFIG || {};
				const submissionKey = `submission_count_${config.objectId}`;
				const submissionCount = parseInt(localStorage.getItem(submissionKey) || '0');
				if (submissionCount > 0) {
					console.log(`Previous submissions found: ${submissionCount}`);
				}
			}, 100);

			editor.focus();
			
		}, error => {
			console.error('Monaco AMD load error:', error);
			monacoInitializing = false;
			const outputDiv = document.getElementById('output');
			if (outputDiv) outputDiv.textContent = 'Failed to load editor. Check network/CSP. Details in console.';
			
			// Retry after error
			setTimeout(() => {
				console.log('Retrying Monaco initialization after AMD error...');
				initMonaco();
			}, 3000);
		});
		
	} catch (error) {
		console.error('Monaco initialization error:', error);
		monacoInitializing = false;
		
		// Show error to user
		const outputDiv = document.getElementById('output');
		if (outputDiv) outputDiv.textContent = 'Editor failed to load. Please refresh the page.';
		
		// Retry after a delay
		setTimeout(() => {
			console.log('Retrying Monaco initialization after error...');
			initMonaco();
		}, 5000);
	}
};

// SCORM API Integration
class ScormAPI {
	constructor() {
		this.initialized = false;
		this.api = null;
		this.isScorm12 = false; // Track SCORM version for method mapping
		this.findAPI();
	}

	findAPI() {
		let win = window;
		let attempts = 0;
		const maxAttempts = 500;

		// Look for SCORM API in current window and parent windows
		while (!this.api && win && attempts < maxAttempts) {
			// Check for SCORM 2004 API first, then SCORM 1.2
			if (win.API_1484_11) {
				this.api = win.API_1484_11;
				console.log('Found SCORM 2004 API (API_1484_11)');
				break;
			} else if (win.API) {
				this.api = win.API;
				console.log('Found SCORM 1.2 API (API)');
				break;
			}

			// Try parent window
			if (win.parent && win.parent !== win) {
				win = win.parent;
			} 
			// Try opener window
			else if (win.opener) {
				win = win.opener;
			} 
			// No more windows to check
			else {
				break;
			}
			attempts++;
		}

		console.log(`SCORM API search completed after ${attempts} attempts`);
		
		if (this.api) {
			// Check for SCORM 1.2 (LMSInitialize) or SCORM 2004 (Initialize) methods
			const initMethod = this.api.LMSInitialize || this.api.Initialize;
			if (typeof initMethod === 'function') {
				try {
					this.initialized = initMethod.call(this.api, '') === 'true';
					console.log('SCORM API found and initialized:', this.initialized);

					// Determine SCORM version for method mapping
					this.isScorm12 = !!this.api.LMSInitialize;
					console.log('SCORM version detected:', this.isScorm12 ? '1.2' : '2004');
				} catch (error) {
					console.error('Error initializing SCORM API:', error);
					this.initialized = false;
				}
			} else {
				console.warn('SCORM API found but missing Initialize/LMSInitialize method - running in standalone mode');
				this.api = null;
				this.initialized = false;
			}
		} else {
			console.log('SCORM API not found after searching - running in standalone mode');
			console.log('This is normal when testing locally or if the LMS does not provide SCORM API');
		}
	}

	setValue(parameter, value) {
		if (this.api && this.initialized) {
			const setValueMethod = this.isScorm12 ? this.api.LMSSetValue : this.api.SetValue;
			if (setValueMethod) {
				return setValueMethod.call(this.api, parameter, value) === 'true';
			}
		}
		console.log(`SCORM SetValue: ${parameter} = ${value}`);
		return true;
	}

	getValue(parameter) {
		if (this.api && this.initialized) {
			const getValueMethod = this.isScorm12 ? this.api.LMSGetValue : this.api.GetValue;
			if (getValueMethod) {
				try {
					const value = getValueMethod.call(this.api, parameter);
					
					// Check for errors using GetLastError/LMSGetLastError
					const errorMethod = this.isScorm12 ? this.api.LMSGetLastError : this.api.GetLastError;
					const errorCode = errorMethod ? errorMethod.call(this.api, '') : '0';
					
					// Always log SCORM data retrieval for student identification fields
					const isStudentField = parameter.includes('student_id') || 
						parameter.includes('student_name') || 
						parameter.includes('learner_id') || 
						parameter.includes('learner_name');
					
					// Log values - always log student fields, others only in debug or on error
					const debugMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
					if (isStudentField || debugMode || errorCode !== '0') {
						console.log(`SCORM getValue: ${parameter} = "${value}"${errorCode !== '0' ? ` (Error: ${errorCode})` : ''}`);
						
						// Get error string if there was an error
						if (errorCode !== '0') {
							const errorStringMethod = this.isScorm12 
								? this.api.LMSGetErrorString 
								: this.api.GetErrorString;
								
							if (errorStringMethod) {
								const errorString = errorStringMethod.call(this.api, errorCode);
								console.error(`SCORM Error: ${errorString}`);
							}
						}
					}
					
					return value;
				} catch (error) {
					console.error(`SCORM error retrieving ${parameter}:`, error);
					return '';
				}
			}
		}
		console.log(`SCORM GetValue attempted but API not available: ${parameter}`);
		return '';
	}

	commit() {
		if (this.api && this.initialized) {
			const commitMethod = this.isScorm12 ? this.api.LMSCommit : this.api.Commit;
			if (commitMethod) {
				return commitMethod.call(this.api, '') === 'true';
			}
		}
		console.log('SCORM Commit called');
		return true;
	}

	finish() {
		if (this.api && this.initialized) {
			const finishMethod = this.isScorm12 ? this.api.LMSFinish : this.api.Terminate;
			if (finishMethod) {
				return finishMethod.call(this.api, '') === 'true';
			}
		}
		console.log('SCORM Terminate/Finish called');
		return true;
	}

	setComplete() {
		this.setValue('cmi.completion_status', 'completed');
		this.setValue('cmi.success_status', 'passed');
		this.setValue('cmi.score.scaled', '1.0');
		this.commit();
		console.log('SCORM: Marked as complete');
	}
	
	// Debug helper function
	debug() {
		const debugInfo = {
			initialized: this.initialized,
			apiExists: !!this.api,
			isScorm12: this.isScorm12
		};
		
		// Only proceed with getting values if API is available
		if (this.api && this.initialized) {
			try {
				// Test retrieving common fields
				if (this.isScorm12) {
					debugInfo.coreStudentId = this.getValue('cmi.core.student_id');
					debugInfo.coreStudentName = this.getValue('cmi.core.student_name');
					debugInfo.coreLessonLocation = this.getValue('cmi.core.lesson_location');
					debugInfo.coreLessonStatus = this.getValue('cmi.core.lesson_status');
				} else {
					// SCORM 2004
					debugInfo.learnerId = this.getValue('cmi.learner_id');
					debugInfo.learnerName = this.getValue('cmi.learner_name');
					debugInfo.location = this.getValue('cmi.location');
					debugInfo.completionStatus = this.getValue('cmi.completion_status');
					debugInfo.successStatus = this.getValue('cmi.success_status');
				}
			} catch (error) {
				debugInfo.error = error.message;
			}
		}
		
		console.table(debugInfo);
		return debugInfo;
	}
}

// Initialize SCORM on page load and make it globally available
const scormAPI = new ScormAPI();
window.scormAPI = scormAPI;

// Add debug function to global scope - useful for troubleshooting in browser console
window.debugScorm = () => {
    const debugInfo = scormAPI.debug();
    console.log('SCORM Debug Info:', debugInfo);
    alert('SCORM debug information has been logged to the console.');
    return debugInfo;
};

// Add a test function to check specific SCORM values - useful for browser console
window.testScormValue = (parameter) => {
    if (!parameter) {
        console.error('Please provide a parameter name to test');
        return 'ERROR: No parameter specified';
    }
    
    const value = scormAPI.getValue(parameter);
    console.log(`SCORM Test - ${parameter}: "${value}"`);
    return value;
};

// Add immediate diagnostics when SCORM loads - will run automatically
window.addEventListener('load', () => {
    // Wait a short time to ensure SCORM API is fully loaded
    setTimeout(() => {
        console.log('=== SCORM DIAGNOSTICS ===');
        if (window.scormAPI && window.scormAPI.initialized) {
            // Get and log key SCORM values
            const isScorm12 = window.scormAPI.isScorm12;
            console.log('SCORM Version:', isScorm12 ? '1.2' : '2004');
            
            // Log the specific fields based on version
            if (isScorm12) {
                const id = window.scormAPI.getValue('cmi.core.student_id');
                const name = window.scormAPI.getValue('cmi.core.student_name');
                const status = window.scormAPI.getValue('cmi.core.lesson_status');
                
                console.log('SCORM 1.2 Student ID:', id);
                console.log('SCORM 1.2 Student Name:', name);
                console.log('SCORM 1.2 Lesson Status:', status);
            } else {
                const id = window.scormAPI.getValue('cmi.learner_id');
                const name = window.scormAPI.getValue('cmi.learner_name');
                const status = window.scormAPI.getValue('cmi.completion_status');
                
                console.log('SCORM 2004 Learner ID:', id);
                console.log('SCORM 2004 Learner Name:', name);
                console.log('SCORM 2004 Completion Status:', status);
            }
        } else {
            console.log('SCORM API not initialized correctly');
            console.log('API exists:', !!window.scormAPI);
            console.log('API initialized:', window.scormAPI?.initialized);
        }
        console.log('=========================');
    }, 1000); // Wait 1 second for SCORM to initialize
});

// Initialize session tracking
window.sessionStartTime = Date.now();

// Submit code function with SCORM integration
function submitCode(code) {
	try {
		const config = window.CODE_PRACTICE_CONFIG || {};
		const timestamp = new Date().toISOString();
		
		// Get submission count for unique interaction IDs
		const submissionKey = `submission_count_${config.objectId}`;
		let submissionCount = parseInt(localStorage.getItem(submissionKey) || '0') + 1;
		localStorage.setItem(submissionKey, submissionCount.toString());
		
		// Prepare submission data
		const submissionData = {
			objectId: config.objectId,
			courseTitle: config.courseTitle,
			practiceTitle: config.practiceTitle,
			language: config.language,
			submittedCode: code,
			timestamp: timestamp,
			studentInfo: {
				id: scormAPI.getValue('cmi.core.student_id') || 'unknown',
				name: scormAPI.getValue('cmi.core.student_name') || 'unknown'
			}
		};

		// Store in localStorage for backup
		localStorage.setItem(`submission_${config.objectId}`, JSON.stringify(submissionData));

		// Initialize the interaction logger with the SCORM API
		const setInteraction = createSetInteraction(scormAPI.api);

		// Log the code submission as an interaction for instructor visibility
		const submissionId = `${config.objectId}_submission_${submissionCount}`;
		const submissionDescription = `Code Practice Submission #${submissionCount} - ${config.practiceTitle || 'Assignment'} (${config.language || 'javascript'})`;
		
		// For very long code, we might need to split into multiple interactions
		if (code.length <= 4000) {
			// Single interaction for shorter code
			setInteraction(
				submissionId,
				'other',
				code,
				'correct',
				submissionDescription,
				true // commit immediately
			);
		} else {
			// Split long code into multiple interactions
			const chunkSize = 3800; // Leave room for metadata
			const chunks = Math.ceil(code.length / chunkSize);
			
			for (let i = 0; i < chunks; i++) {
				const start = i * chunkSize;
				const end = Math.min(start + chunkSize, code.length);
				const chunk = code.substring(start, end);
				const chunkId = `${submissionId}_part${i + 1}of${chunks}`;
				const chunkDesc = `${submissionDescription} - Part ${i + 1} of ${chunks}`;
				
				setInteraction(
					chunkId,
					'other',
					chunk,
					'correct',
					chunkDesc,
					i === chunks - 1 // only commit on the last chunk
				);
			}
		}

		// Also store metadata as a separate interaction
		const metadata = JSON.stringify({
			objectId: config.objectId,
			courseTitle: config.courseTitle,
			practiceTitle: config.practiceTitle,
			language: config.language,
			codeLength: code.length,
			submissionTime: timestamp,
			studentId: submissionData.studentInfo.id,
			studentName: submissionData.studentInfo.name
		});

		setInteraction(
			`${submissionId}_metadata`,
			'other',
			metadata,
			'correct',
			`Submission #${submissionCount} Metadata - ${config.practiceTitle || 'Assignment'}`,
			true
		);

		// Update lesson location for tracking
		scormAPI.setValue('cmi.core.lesson_location', `${config.objectId}_${timestamp}`);

		// Store summary in suspend_data as backup
		const suspendData = JSON.stringify({
			lastSubmittedAt: timestamp,
			submissionCount: submissionCount,
			codeLength: code.length,
			language: config.language,
			interactionCount: scormAPI.api.LMSGetValue('cmi.interactions._count')
		});
		scormAPI.setValue('cmi.suspend_data', suspendData);

		// Final commit
		const commitResult = scormAPI.commit();
		
		console.log('SCORM submission completed:', {
			submissionNumber: submissionCount,
			interactionCount: scormAPI.api.LMSGetValue('cmi.interactions._count'),
			commitResult: commitResult,
			codeLength: code.length,
			chunks: code.length > 4000 ? Math.ceil(code.length / 3800) : 1
		});

		// Show success message
		const interactionCount = scormAPI.api.LMSGetValue('cmi.interactions._count');
		alert(`Code submitted successfully! 🎉\n\nSubmission #${submissionCount} has been logged to the LMS for instructor review.\nSubmission details:\n- Code length: ${code.length} characters\n- Language: ${config.language}\n- SCORM interactions created: ${interactionCount}\n- Timestamp: ${getScormTime()}\n\nYou can submit again if needed.`);

		// Briefly show success state, then reset button
		const submitBtn = document.querySelector('#submit');
		if (submitBtn) {
			// Store the original default HTML (not the current HTML which might be from a previous submission)
			const defaultHtml = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m438-240 226-226-58-58-169 169-84-84-57 57 142 142ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"/></svg><span>Submit</span>';
			const originalBg = submitBtn.style.background || '';
			
			submitBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ffffff"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg><span>Submitted #' + submissionCount + '</span>';
			submitBtn.style.background = '#28a745';
			
			// Reset button after 3 seconds to default state
			setTimeout(() => {
				submitBtn.innerHTML = defaultHtml;
				submitBtn.style.background = originalBg;
			}, 3000);
		}

		return true;

	} catch (error) {
		console.error('Submission error:', error);
		alert('There was an error submitting your code. Please try again.\n\nError: ' + error.message);
		return false;
	}
}
