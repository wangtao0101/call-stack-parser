const fs = require('fs');
const path = require('path');
const { SourceMapConsumer } = require('source-map');

function getFileName(filePath) {
  const pathList = filePath.split('/');
  return pathList[pathList.length - 1];
}

const parse = async (stack, dirPath) => {
  const stackLines = stack.split(/\n/);
  const lines = [];
  const cacheConsumers = {};
  for (const line of stackLines) {
    const match = line.match(/(^\s*at .*?\(?)([^()]+)(:([0-9]+):([0-9]+)\)?.*$)/);
    if (!match) {
      lines.push(line);
      continue;
    }
    const filename = getFileName(match[2]);
    const lineN = parseInt(match[4]);
    const columnN = parseInt(match[5]);
    const filePath = path.join(dirPath, filename + '.map');
    if (fs.existsSync(filePath)) {
      let consumer = cacheConsumers[filePath];
      if (consumer == null) {
        const sourceContent = fs.readFileSync(filePath);
        const sourceMap = JSON.parse(sourceContent.toString());
        consumer = await new SourceMapConsumer(sourceMap);
      }
      const position = consumer.originalPositionFor({
        line: lineN, // line: 1-based
        column: columnN - 1, // column: 0-based
      });
      lines.push({
        path: filePath,
        source: position.source,
        line: position.line,
        column: position.column,
        name: position.name,
      });
    } else {
      lines.push(line);
    }
  }
  Object.keys(cacheConsumers).map(key => {
    cacheConsumers[key].destroy();
  });
  return lines;
};

const getContent = async (filePath, sourceFile) => {
  if (fs.existsSync(filePath)) {
    const sourceContent = fs.readFileSync(filePath);
    const sourceMap = JSON.parse(sourceContent.toString());
    const consumer = await new SourceMapConsumer(sourceMap);
    const content = consumer.sourceContentFor(sourceFile);
    consumer.destroy();
    return content;
  }
  return null;
};

module.exports = {
  parse,
  getContent,
};
