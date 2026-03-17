const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const readline = require('readline');
const http = require('http');
const net = require('net');

let mainWindow;
let nextProcess;
let pythonProcess;
let pythonReady = false;
let pendingRequests = new Map();
let requestId = 0;

const isDev = !app.isPackaged;
const PORT = 3000;
const NEXT_URL = `http://localhost:${PORT}`;

const NEXT_APP_PATH = isDev
    ? path.join(__dirname, '..', 'frontend')
    : path.join(process.resourcesPath, 'app', 'frontend');

// ─── Loading Screen HTML ──────────────────────────────────────────────────────

const LOADING_HTML = `data:text/html,<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>FlowSheet — Loading...</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #0a0f1e;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    gap: 24px;
  }
  .logo { font-size: 48px; }
  h1 { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
  p { font-size: 14px; color: rgba(255,255,255,0.4); }
  .spinner {
    width: 40px; height: 40px;
    border: 3px solid rgba(99,102,241,0.2);
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
  <div class="logo">⬡</div>
  <h1>FlowSheet</h1>
  <div class="spinner"></div>
  <p>Starting server, please wait...</p>
</body>
</html>`;

// ─── Server Wait ──────────────────────────────────────────────────────────────

function waitForServer(url, maxRetries = 120, interval = 1000) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const check = () => {
            http.get(url, (res) => {
                if (res.statusCode < 500) resolve();
                else { attempts++; if (attempts >= maxRetries) reject(new Error('Server returned error')); else setTimeout(check, interval); }
            }).on('error', () => {
                attempts++;
                if (attempts >= maxRetries) reject(new Error(`Server did not start after ${maxRetries}s`));
                else setTimeout(check, interval);
            });
        };
        check();
    });
}

// ─── Next.js Server ──────────────────────────────────────────────────────────

// Check if port is already in use
function isPortInUse(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', () => resolve(true));   // port in use
        server.once('listening', () => {
            server.close();
            resolve(false); // port free
        });
        server.listen(port);
    });
}

async function startNextServer() {
    const inUse = await isPortInUse(PORT);
    if (inUse) {
        console.log(`[Next] Port ${PORT} already in use — connecting to existing server`);
        return; // reuse whatever is already listening
    }

    const env = { ...process.env, NODE_ENV: isDev ? 'development' : 'production', PORT: String(PORT) };
    let cmd, args;

    if (isDev) {
        cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
        args = ['next', 'dev', '--port', String(PORT)];
    } else {
        cmd = process.execPath;
        args = ['server.js'];
        env.ELECTRON_RUN_AS_NODE = '1';
    }

    console.log(`[Next] ${cmd} ${args.join(' ')} in ${NEXT_APP_PATH}`);

    nextProcess = spawn(cmd, args, {
        cwd: NEXT_APP_PATH,
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32' && isDev,
    });

    nextProcess.stdout.on('data', d => console.log('[Next]', d.toString().trim()));
    nextProcess.stderr.on('data', d => console.error('[Next ERR]', d.toString().trim()));
    nextProcess.on('error', err => console.error('[Next] Failed to start:', err));
    nextProcess.on('close', code => console.log(`[Next] Exited: ${code}`));
}

// ─── Python Bridge ────────────────────────────────────────────────────────────

function startPythonBridge() {
    const fs = require('fs');
    const pythonScript = path.join(__dirname, 'python_bridge.py');
    const systemPaths = [
        'C:\\Program Files\\FreeCAD 1.0\\bin\\python.exe',
        'C:\\Program Files\\FreeCAD 0.21\\bin\\python.exe',
        'C:\\Program Files\\FreeCAD 1.1\\bin\\python.exe',
    ];

    let pythonPath = 'python';
    const bundled = path.join(process.resourcesPath || '', 'FreeCAD', 'bin', 'python.exe');
    if (fs.existsSync(bundled)) pythonPath = bundled;
    else for (const p of systemPaths) if (fs.existsSync(p)) { pythonPath = p; break; }

    console.log(`[Python] Spawning: ${pythonPath}`);
    const pythonDir = path.dirname(pythonPath);

    pythonProcess = spawn(pythonPath, [pythonScript], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: pythonDir,
        env: { ...process.env, PYTHONHOME: pythonDir, PYTHONNOUSERSITE: '1', PYTHONPATH: '' }
    });

    const rl = readline.createInterface({ input: pythonProcess.stdout });
    rl.on('line', line => {
        try {
            const resp = JSON.parse(line.trim());
            if (resp._id !== undefined) {
                const res = pendingRequests.get(resp._id);
                if (res) { res(resp); pendingRequests.delete(resp._id); }
            }
        } catch { }
    });
    pythonProcess.stderr.on('data', d => console.log('[Python]', d.toString()));
    pythonProcess.on('close', () => { pythonReady = false; });
    pythonReady = true;
}

// ─── Window ──────────────────────────────────────────────────────────────────

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 1000,
        minWidth: 1200,
        minHeight: 800,
        title: 'FlowSheet',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        backgroundColor: '#0a0f1e',
        show: false,
    });

    // Keyboard shortcuts
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.type === 'keyDown') {
            if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
                mainWindow.webContents.toggleDevTools();
                event.preventDefault();
            }
            if (input.key === 'F5' || (input.control && input.key === 'r')) {
                mainWindow.reload();
                event.preventDefault();
            }
        }
    });

    // Show loading screen immediately
    mainWindow.loadURL(LOADING_HTML);
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.maximize();
    });
    mainWindow.on('closed', () => { mainWindow = null; });

    // Wait for Next.js to be ready, then redirect to the app
    waitForServer(NEXT_URL, 120, 1000)
        .then(() => {
            console.log('[Main] Next.js ready — loading app');
            if (mainWindow) mainWindow.loadURL(NEXT_URL);
        })
        .catch(err => {
            console.error('[Main] Never connected to Next.js:', err.message);
        });
}

// ─── App Lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
    console.log(`[Main] FlowSheet starting (isDev=${isDev})`);
    await startNextServer();
    try { startPythonBridge(); } catch (e) { console.warn('[Python] Optional bridge skipped:', e.message); }
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (nextProcess) nextProcess.kill();
    if (pythonProcess) {
        try { pythonProcess.stdin.write(JSON.stringify({ action: 'exit' }) + '\n'); } catch { }
        setTimeout(() => { if (pythonProcess) pythonProcess.kill(); if (process.platform !== 'darwin') app.quit(); }, 1000);
    } else {
        if (process.platform !== 'darwin') app.quit();
    }
});

// ─── IPC ─────────────────────────────────────────────────────────────────────

ipcMain.handle('ping', async () => 'pong from Electron');
ipcMain.handle('python-status', async () => ({ ready: pythonReady }));
ipcMain.handle('run-python', async (_, code, inputs) => {
    try {
        return new Promise((resolve, reject) => {
            if (!pythonProcess || !pythonReady) return reject(new Error('Python bridge not running'));
            const id = requestId++;
            const cmd = { action: 'execute', code, inputs: inputs || {}, _id: id };
            pendingRequests.set(id, resolve);
            setTimeout(() => { pendingRequests.delete(id); reject(new Error('Timeout')); }, 60000);
            pythonProcess.stdin.write(JSON.stringify(cmd) + '\n', 'utf8');
        });
    } catch (e) { return { success: false, error: e.message }; }
});
