const { app, BrowserWindow, screen } = require('electron')
const path = require('path')

let mainWindow
let loadingWindow

function createLoadingWindow() {
    loadingWindow = new BrowserWindow({
        width: 150,
        height: 100,
        frame: false,
        transparent: true,
        resizable: false,
        webPreferences: {
            nodeIntegration: true
        }
    })

    loadingWindow.loadFile(path.join(__dirname, 'pages/index.html'))
    loadingWindow.on('closed', () => { loadingWindow = null })

}

function createMainWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize

    mainWindow = new BrowserWindow({
        width: 500,
        height: 700,
        x: width - 520,
        y: height - 700,
        show: false,
        frame: false,
        resizable: false,
        webPreferences: {
            nodeIntegration: true
        }
    })

    mainWindow.loadURL('http://chat.deepseek.com')
    mainWindow.webContents.on('did-finish-load', () => {
        if (loadingWindow) {
            loadingWindow.close()
        }
        mainWindow.show()
    })

    mainWindow.on('closed', () => { mainWindow = null })
    
    mainWindow.webContents.executeJavaScript(`
        const { ipcRenderer } = require('electron');
        document.body.style.webkitAppRegion = 'drag';
    `)
}

app.whenReady().then(() => {
    createLoadingWindow()
    createMainWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createLoadingWindow()
            createMainWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})