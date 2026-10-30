const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    printPDF: (htmlContent, printerType, showPreview) => ipcRenderer.invoke('print-pdf', htmlContent, printerType, showPreview),
    printText: (textContent, showPreview) => ipcRenderer.invoke('print-text', textContent, showPreview),
});
