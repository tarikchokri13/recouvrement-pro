const { app, BrowserWindow, Menu, Tray, dialog, shell } = require('electron');
const path = require('path');
const { spawn, fork } = require('child_process');
const fs = require('fs');

// ── Config ──
const PORT = 3001;
const isDev = !app.isPackaged;
let mainWindow = null;
let serverProcess = null;
let tray = null;

// ── Paths ──
function getServerPath() {
  if (isDev) return path.join(__dirname, 'server.js');
  return path.join(process.resourcesPath, 'server', 'server.js');
}

function getDataDir() {
  return path.join(app.getPath('userData'), 'data');
}

// ── Start Express server ──
function startServer() {
  return new Promise(function(resolve, reject) {
    var serverPath = getServerPath();
    console.log('Lancement serveur:', serverPath);

    // Set data directory for packaged app
    var env = Object.assign({}, process.env, {
      PORT: String(PORT),
      DATA_DIR: getDataDir(),
      NODE_ENV: 'production'
    });

    serverProcess = fork(serverPath, [], {
      env: env,
      stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });

    serverProcess.stdout.on('data', function(data) {
      console.log('[Server]', data.toString().trim());
    });

    serverProcess.stderr.on('data', function(data) {
      console.error('[Server Error]', data.toString().trim());
    });

    serverProcess.on('error', function(err) {
      console.error('Server failed:', err);
      reject(err);
    });

    // Wait for server to be ready
    var attempts = 0;
    var checkServer = setInterval(function() {
      attempts++;
      var http = require('http');
      var req = http.get('http://localhost:' + PORT + '/api/users', function(res) {
        clearInterval(checkServer);
        console.log('Serveur pret sur port', PORT);
        resolve();
      });
      req.on('error', function() {
        if (attempts > 30) {
          clearInterval(checkServer);
          reject(new Error('Serveur timeout'));
        }
      });
      req.setTimeout(1000);
    }, 500);
  });
}

// ── Create window ──
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'Recouvrement Pro',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    backgroundColor: '#0C0F1A',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    show: false
  });

  // Load the React app from the local server
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL('http://localhost:' + PORT);
  }

  mainWindow.once('ready-to-show', function() {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', function() {
    mainWindow = null;
  });

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(function(details) {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // ── Menu ──
  var menuTemplate = [
    {
      label: 'Fichier',
      submenu: [
        { label: 'Exporter Excel', click: function() { mainWindow.loadURL('http://localhost:' + PORT + '/api/export/csv?token='); } },
        { type: 'separator' },
        { label: 'Ouvrir dossier données', click: function() { shell.openPath(getDataDir()); } },
        { type: 'separator' },
        { role: 'quit', label: 'Quitter' }
      ]
    },
    {
      label: 'Affichage',
      submenu: [
        { role: 'reload', label: 'Actualiser' },
        { role: 'toggleDevTools', label: 'Outils développeur' },
        { type: 'separator' },
        { role: 'zoomIn', label: 'Zoom +' },
        { role: 'zoomOut', label: 'Zoom -' },
        { role: 'resetZoom', label: 'Zoom 100%' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Plein écran' }
      ]
    },
    {
      label: 'Aide',
      submenu: [
        { label: 'À propos', click: function() { dialog.showMessageBox(mainWindow, { type: 'info', title: 'Recouvrement Pro', message: 'Recouvrement Pro v2.0\nGestion des créances impayées\nChèques · LCN · Factures', buttons: ['OK'] }); } }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
}

// ── App lifecycle ──
app.whenReady().then(function() {
  console.log('');
  console.log('  ==========================================');
  console.log('  RECOUVREMENT PRO v2 — Desktop');
  console.log('  ==========================================');
  console.log('');

  startServer()
    .then(function() {
      createWindow();
    })
    .catch(function(err) {
      console.error('Erreur démarrage:', err);
      dialog.showErrorBox('Erreur', 'Impossible de démarrer le serveur:\n' + err.message);
      app.quit();
    });
});

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function() {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', function() {
  console.log('Fermeture...');
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});
