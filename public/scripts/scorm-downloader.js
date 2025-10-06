// Shared SCORM generation and download utility
export async function handleScormGeneration(formElement, apiEndpoint, options = {}) {
    const {
        buttonSelector = 'button[type="submit"]',
        loadingText = 'Generating...',
        defaultFilename = 'scorm-package.zip',
        onPrepareForm = null,
        onSuccess = null,
        onError = null
    } = options;

    const submitButton = formElement.querySelector(buttonSelector);
    if (!submitButton) {
        console.error('Submit button not found');
        return;
    }

    const originalText = submitButton.textContent;
    submitButton.textContent = loadingText;
    submitButton.disabled = true;

    try {
        // Call preparation function if provided
        if (onPrepareForm && typeof onPrepareForm === 'function') {
            await onPrepareForm();
        }

        const formData = new FormData(formElement);
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            // Try to get filename from Content-Disposition header
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = defaultFilename;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }
            
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

            // Call success callback if provided
            if (onSuccess && typeof onSuccess === 'function') {
                onSuccess(response, filename);
            }
        } else {
            const error = await response.text();
            const errorMessage = `Error: ${error}`;
            
            if (onError && typeof onError === 'function') {
                onError(errorMessage, response);
            } else {
                alert(errorMessage);
            }
        }
    } catch (error) {
        console.error('SCORM generation error:', error);
        const errorMessage = 'An error occurred while generating the SCORM package.';
        
        if (onError && typeof onError === 'function') {
            onError(errorMessage, error);
        } else {
            alert(errorMessage);
        }
    } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

// Convenience function for setting up form submission handlers
export function setupScormFormHandler(formId, apiEndpoint, options = {}) {
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById(formId);
        if (!form) {
            console.error(`Form with ID "${formId}" not found`);
            return;
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleScormGeneration(form, apiEndpoint, options);
        });
    });
}