const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Determine if we're in development or production
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, 'public', 'icon.png'),
    title: 'PharmaFlow IMS',
    backgroundColor: '#f3f4f6',
  });

  // Maximize window on startup
  mainWindow.maximize();

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Handle window close
  mainWindow.on('closed', () => { });

  // Setup type detection and tracking (only in production)
  if (!isDev) {
    const userDataPath = app.getPath('userData');
    const metadataPath = path.join(__dirname, 'setup-metadata.json');

    try {
      // Read setup metadata to determine if this is testing or commercial
      let setupType = 'TESTING'; // Default to testing

      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        setupType = metadata.setupType || 'TESTING';
        console.log(`Setup Type: ${setupType}`);

        // For COMMERCIAL setups, mark as installed in registry
        if (setupType === 'COMMERCIAL') {
          const { exec } = require('child_process');
          exec('reg add "HKCU\\Software\\PharmaFlow\\IMS" /v CommercialSetupInstalled /t REG_SZ /d "1" /f', (error) => {
            if (error) {
              console.error('Could not set registry key:', error);
            } else {
              console.log('Commercial setup marked as installed in registry');
            }
          });
        }
      }

      // Create marker file on first launch (for both types)
      const installedMarkerPath = path.join(userDataPath, '.installed');
      if (!fs.existsSync(installedMarkerPath)) {
        if (!fs.existsSync(userDataPath)) {
          fs.mkdirSync(userDataPath, { recursive: true });
        }
        fs.writeFileSync(installedMarkerPath, JSON.stringify({
          setupType: setupType,
          installDate: new Date().toISOString(),
          version: '1.2.0'
        }));
        console.log('Installation marker created');
      }

    } catch (err) {
      console.error('Error in setup tracking:', err);
    }
  }

}

// App initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handler for Silent Printing
ipcMain.handle('print-pdf', async (event, htmlContent, printerType, showPreview) => {
  try {
    const isThermal = printerType === 'thermal';

    // IMPORTANT: We always set show:true but position the window off-screen when not previewing.
    // Hidden windows (show:false) don't properly render HTML in Electron, causing blank/garbage prints.
    const printWindow = new BrowserWindow({
      show: true,
      x: showPreview ? undefined : -9999, // Move off-screen when not previewing
      y: showPreview ? undefined : -9999,
      width: isThermal ? 300 : 800,
      height: 900,
      skipTaskbar: !showPreview, // Don't show in taskbar when silently printing
      title: 'Print Preview',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      }
    });

    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    // Wait longer to ensure full HTML layout/rendering before printing
    await new Promise(resolve => setTimeout(resolve, 1500));

    const printOptions = {
      silent: !showPreview,
      printBackground: true,
      // scaleFactor: scales the page content to fit the paper (replicates the manual
      // "Scale to Fit" the user was selecting in the preview dialog).
      // For thermal slips we use 100 because the HTML is already constrained to 260px width.
      // For standard A4/Letter we use 100 which lets Electron fit content to the printable area.
      scaleFactor: 100,
      // pageSize tells Electron (and the OS print spooler) what paper size to target.
      // For thermal printers we define a custom narrow roll (72mm wide, 200mm tall – auto-cut).
      // For standard printers we target A4.
      pageSize: isThermal
        ? { width: 72000, height: 200000 } // micrometers: 72 mm × 200 mm
        : 'A4',
      margins: {
        marginType: isThermal ? 'none' : 'printableArea'
      }
    };

    return new Promise((resolve) => {
      printWindow.webContents.print(printOptions, (success, failureReason) => {
        if (!success && failureReason !== 'Print job canceled') {
          console.error('Print failed:', failureReason);
        }

        // Wait before closing so the OS print spooler fully processes the job.
        setTimeout(() => {
          if (!printWindow.isDestroyed()) {
            printWindow.close();
          }
        }, showPreview ? 1000 : 4000);

        resolve({ success: success || failureReason === 'Print job canceled' });
      });
    });

  } catch (error) {
    console.error('Error during printing:', error);
    return { success: false, error: error.message };
  }
});

// IPC Handler for Thermal Text Printing
// Writes receipt as plain .txt file and prints via notepad /p (works correctly on thermal printers)
ipcMain.handle('print-text', async (event, textContent, showPreview) => {
  const { exec } = require('child_process');
  const os = require('os');

  try {
    // Write plain text to a temp file
    const tempFile = path.join(os.tmpdir(), `pharmaflow_receipt_${Date.now()}.txt`);
    fs.writeFileSync(tempFile, textContent, { encoding: 'utf8' });

    return new Promise((resolve) => {
      const cmd = showPreview
        // Open in Notepad so user can review, then manually print
        ? `notepad.exe "${tempFile}"`
        // Silent print via Notepad (same method user confirmed works)
        : `notepad.exe /p "${tempFile}"`;

      exec(cmd, (error) => {
        // Give Notepad time to spool the job before deleting the temp file
        setTimeout(() => {
          try { fs.unlinkSync(tempFile); } catch (_) {}
        }, showPreview ? 30000 : 8000);

        if (error && !showPreview) {
          console.error('Text print error:', error);
          resolve({ success: false, error: error.message });
        } else {
          resolve({ success: true });
        }
      });
    });

  } catch (error) {
    console.error('Error during text printing:', error);
    return { success: false, error: error.message };
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
