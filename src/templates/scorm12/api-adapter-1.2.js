// SCORM 1.2 API Adapter
// Basic implementation for SCORM communication

var API = {
    initialized: false,
    data: {
        // Default SCORM 1.2 student data - can be overridden
        'cmi.core.student_id': 'demo_student_123',
        'cmi.core.student_name': 'Demo Student',
        'cmi.core.lesson_location': '',
        'cmi.core.lesson_status': 'not attempted',
        'cmi.core.score.raw': '',
        'cmi.core.score.max': '100',
        'cmi.core.score.min': '0',
        'cmi.core.total_time': '00:00:00',
        'cmi.core.session_time': '00:00:00',
        'cmi.core.credit': 'credit',
        'cmi.core.entry': 'ab-initio',
        'cmi.core.exit': ''
    },
    
    LMSInitialize: function(parameter) {
        if (parameter !== "") {
            return "false";
        }
        this.initialized = true;
        console.log("SCORM: LMSInitialize called");
        return "true";
    },
    
    LMSFinish: function(parameter) {
        if (parameter !== "") {
            return "false";
        }
        this.initialized = false;
        console.log("SCORM: LMSFinish called");
        return "true";
    },
    
    LMSGetValue: function(element) {
        if (!this.initialized) {
            return "";
        }
        console.log("SCORM: LMSGetValue - " + element);
        return this.data[element] || "";
    },
    
    LMSSetValue: function(element, value) {
        if (!this.initialized) {
            return "false";
        }
        console.log("SCORM: LMSSetValue - " + element + " = " + value);
        this.data[element] = value;
        return "true";
    },
    
    LMSCommit: function(parameter) {
        if (!this.initialized || parameter !== "") {
            return "false";
        }
        console.log("SCORM: LMSCommit called");
        return "true";
    },
    
    LMSGetLastError: function() {
        return "0";
    },
    
    LMSGetErrorString: function(errorCode) {
        return "No error";
    },
    
    LMSGetDiagnostic: function(errorCode) {
        return "No diagnostic information";
    },
    
    // Helper method to set student data (for testing/demo purposes)
    setStudentData: function(studentId, studentName) {
        this.data['cmi.core.student_id'] = studentId || 'demo_student_123';
        this.data['cmi.core.student_name'] = studentName || 'Demo Student';
        console.log("SCORM: Student data updated - ID: " + this.data['cmi.core.student_id'] + ", Name: " + this.data['cmi.core.student_name']);
    },
    
    // Helper method to get all current data (for debugging)
    getAllData: function() {
        return this.data;
    }
};

// Make API available globally
window.API = API;

// Try to get student info from URL parameters or other sources
(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get('student_id') || urlParams.get('studentId') || urlParams.get('user_id');
    const studentName = urlParams.get('student_name') || urlParams.get('studentName') || urlParams.get('user_name') || urlParams.get('name');
    
    if (studentId || studentName) {
        API.setStudentData(studentId, studentName);
        console.log("SCORM: Student data loaded from URL parameters");
    }
    
    // Also check for data in sessionStorage or localStorage
    try {
        const storedStudentData = localStorage.getItem('scorm_student_data') || sessionStorage.getItem('scorm_student_data');
        if (storedStudentData) {
            const data = JSON.parse(storedStudentData);
            if (data.id || data.name) {
                API.setStudentData(data.id, data.name);
                console.log("SCORM: Student data loaded from storage");
            }
        }
    } catch (e) {
        console.log("SCORM: No stored student data found");
    }
})();

console.log("SCORM 1.2 API Adapter loaded");
console.log("SCORM: Current student data:", { 
    id: API.data['cmi.core.student_id'], 
    name: API.data['cmi.core.student_name'] 
});

// Global helper functions for testing
window.updateScormStudent = function(id, name) {
    if (window.API) {
        window.API.setStudentData(id, name);
        console.log("Updated SCORM student data. Refresh to see changes in template variables.");
        return { id: window.API.data['cmi.core.student_id'], name: window.API.data['cmi.core.student_name'] };
    }
    return "SCORM API not available";
};

window.getScormData = function() {
    if (window.API) {
        return window.API.getAllData();
    }
    return "SCORM API not available";
};