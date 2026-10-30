const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('====================================================');
console.log(' 🚌 Starting SafarSathi Bus Booking Servers...');
console.log('====================================================');

// Find PHP executable (XAMPP or PATH)
const xamppPhp = 'C:\\xampp\\php\\php.exe';
const phpCmd = fs.existsSync(xamppPhp) ? xamppPhp : 'php';

// 1. Start PHP Backend on 127.0.0.1:8000
const phpProc = spawn(phpCmd, ['-S', '127.0.0.1:8000', 'backend/index.php'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

// 2. Start Vite Frontend on localhost:5173
const viteProc = spawn('npm', ['run', 'dev', '--prefix', 'frontend'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

process.on('SIGINT', () => {
  phpProc.kill();
  viteProc.kill();
  process.exit(0);
});

