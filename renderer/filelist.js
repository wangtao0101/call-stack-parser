const { ipcRenderer } = require('electron');

ipcRenderer.on('file-data', (event, data) => {
  document.title = data.filename;
  let html = '';
  data.files.map(file => {
    html += `<a href="#" class="filename" data-path="${file}">${file}</a></br>`
  });
  document.getElementById('filelist').innerHTML = html;

  const aEL = document.querySelectorAll('.filename');
  aEL.forEach(function(item) {
    item.addEventListener('click', function() {
      const filename = item.dataset.path;
      ipcRenderer.send('get-source-content', data.filePath, filename, 0, 0);
    });
  });
});
