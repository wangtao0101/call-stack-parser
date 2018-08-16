const { ipcRenderer } = require('electron');

let selectedPath = null;

const selectDirBtn = document.getElementById('select-sourcemap');
const parseBtn = document.getElementById('parse-call-stack');
const emptyBtn = document.getElementById('empty-all');

selectDirBtn.addEventListener('click', event => {
  ipcRenderer.send('open-file-dialog');
});

emptyBtn.addEventListener('click', event => {
  document.getElementById('source-map-dir').innerHTML = '';
  document.getElementById('parsed-text').innerHTML = '';
  document.getElementById('original-text').value = '';
  selectedPath = null;
});

parseBtn.addEventListener('click', event => {
  if (selectedPath == null) {
    ipcRenderer.send('open-error-dialog', `SourceMap Directory can't be empty`, '');
    return;
  }
  const originalText = document.getElementById('original-text').value;
  if (originalText.trim() === '') {
    ipcRenderer.send('open-error-dialog', `Target Call Stack can't be empty`, '');
    return;
  }
  ipcRenderer.send('parse-source-map', originalText, selectedPath);
});

ipcRenderer.on('selected-directory', (event, path, files) => {
  if (files != null) {
    document.getElementById('source-map-dir').innerHTML = `${files.join('\n')}`;
    selectedPath = path;
  }
});

ipcRenderer.on('source-map-result', (event, files) => {
  if (files != null) {
    document.getElementById('parsed-text').innerHTML = `${files.join('\n')}`;
  }
});