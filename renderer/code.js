const path = require('path');
const { ipcRenderer } = require('electron');

function uriFromPath(_path) {
  var pathName = path.resolve(_path).replace(/\\/g, '/');
  if (pathName.length > 0 && pathName.charAt(0) !== '/') {
    pathName = '/' + pathName;
  }
  return encodeURI('file://' + pathName);
}

amdRequire.config({
  baseUrl: uriFromPath(path.join(__dirname, '../node_modules/monaco-editor/min')),
});

// workaround monaco-css not understanding the environment
self.module = undefined;
// workaround monaco-typescript not understanding the environment
self.process.browser = true;

ipcRenderer.on('file-data', (event, data) => {
  document.title = data.sourceFile;
  amdRequire(['vs/editor/editor.main'], function() {
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true
    });
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        jsx: "preserve",
    });
    const editor = monaco.editor.create(document.getElementById('container'), {
      value: data.content,
      language: 'typescript',
      minimap: {
        enabled: false,
      },
      automaticLayout: true,
    });
    editor.setPosition({
        column: data.column,
        lineNumber: data.line,
    });
    editor.revealRangeInCenterIfOutsideViewport(new monaco.Range(data.line, data.column, data.line, data.column + 1));
    if (data.name) {
        editor.setSelection(new monaco.Range(data.line, data.column, data.line, data.column + data.name.length + 1));
    } else {
        editor.setSelection(new monaco.Range(data.line, data.column, data.line, data.column + 1));
    }
  });
});
