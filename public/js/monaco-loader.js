// Monaco Editor Loader
class MonacoLoader {
  constructor() {
    this.editors = {}
  }

  async loadMonaco() {
    return new Promise((resolve, reject) => {
      if (typeof require === 'function') {
        require.config({ 
          paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@latest/min/vs' } 
        });
        require(['vs/editor/editor.main'], () => resolve());
      } else {
        setTimeout(() => this.loadMonaco().then(resolve), 100);
      }
    });
  }

  createEditor(containerId, options = {}) {
    const defaultOptions = {
      value: '',
      language: 'javascript',
      theme: 'vs-light',
      minimap: { enabled: false },
      fontSize: 16
    };

    const editor = monaco.editor.create(
      document.getElementById(containerId), 
      { ...defaultOptions, ...options }
    );

    this.editors[containerId] = editor;
    return editor;
  }

  getEditor(containerId) {
    return this.editors[containerId];
  }

  setLanguage(editorId, language) {
    const editor = this.getEditor(editorId);
    if (editor) {
      const monacoLang = this.getMonacoLanguage(language);
      monaco.editor.setModelLanguage(editor.getModel(), monacoLang);
    }
  }

  getValue(editorId) {
    const editor = this.getEditor(editorId);
    return editor ? editor.getValue() : '';
  }

  getMonacoLanguage(language) {
    const langMap = {
      csharp: 'csharp',
      cpp: 'cpp', 
      java: 'java',
      javascript: 'javascript',
      php: 'php',
      powershell: 'powershell',
      python: 'python'
    };
    return langMap[language] || 'plaintext';
  }
}

// Global instance
window.monacoLoader = new MonacoLoader();