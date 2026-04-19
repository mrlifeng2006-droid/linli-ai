const { spawn } = require('child_process');
const path = require('path');

const server = spawn('node', ['dist/app.js'], {
  cwd: path.resolve(__dirname),
  stdio: 'inherit'
});

server.on('error', (err) => {
  console.error('启动失败:', err);
});

// 保持运行
setInterval(() => {}, 1000);
