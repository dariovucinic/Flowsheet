const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer
contextBridge.exposeInMainWorld('electronAPI', {
    // Basic checks
    ping: () => ipcRenderer.invoke('ping'),
    isElectron: true,
    platform: process.platform,

    // Python bridge
    pythonStatus: () => ipcRenderer.invoke('python-status'),
    runPython: (code, inputs) => ipcRenderer.invoke('run-python', code, inputs),
});

console.log('FlowSheet Electron preload loaded');
