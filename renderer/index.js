const { ipcRenderer } = require('electron');
const { BrowserWindow } = require('electron').remote;

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

ipcRenderer.on('source-map-result', (event, stacks) => {
  if (stacks != null) {
    let html = '';
    stacks.map(stack => {
      if (typeof stack === 'string') {
        html += `${stack}<br/>`;
      } else {
        html += `<a href="#" class="code" data-path="${stack.path}" data-name="${stack.name}">${stack.source}:${stack.line}:${
          stack.column
        }</a><br/>`;
      }
    });
    document.getElementById('parsed-text').innerHTML = html;
    const aEL = document.querySelectorAll('.code');
    aEL.forEach(function(item) {
      item.addEventListener('click', function() {
        const filePath = item.dataset.path;
        const name = item.dataset.name;
        const splitedValue = item.innerHTML.split(':');
        ipcRenderer.send(
          'get-source-content',
          filePath,
          splitedValue[0],
          parseInt(splitedValue[1]),
          parseInt(splitedValue[2]),
          name,
        );
      });
    });
  }
});

ipcRenderer.on('source-content', (event, sourceFile, content, line, column, name) => {
  let win = new BrowserWindow({ width: 800, height: 800 });
  win.setMenu(null);

  win.on('close', () => {
    win = null;
  });
  let url = require('url').format({
    protocol: 'file',
    slashes: true,
    pathname: require('path').join(__dirname, '../sections/code.html'),
  });
  win.loadURL(url);
  win.webContents.on('dom-ready', () => {
    win.webContents.send('file-data', {
      sourceFile,
      content,
      line,
      column,
      name,
    })
  });
  win.show();
});
