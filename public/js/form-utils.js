// Form Utilities
class FormUtils {
  static generateId(courseTitle, practiceTitle) {
    if (!courseTitle && !practiceTitle) return '';
    
    return (courseTitle + '-' + practiceTitle)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');
  }

  static validateRequired(formData, requiredFields) {
    const errors = [];
    
    requiredFields.forEach(field => {
      if (!formData[field] || !formData[field].toString().trim()) {
        errors.push(`${field} is required`);
      }
    });

    return errors;
  }

  static showError(message) {
    // You could replace this with a more sophisticated notification system
    alert(message);
  }

  static showSuccess(message) {
    alert(message);
  }
}

window.FormUtils = FormUtils;