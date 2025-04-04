const { app, Tray, BrowserWindow, nativeImage, screen, Menu, globalShortcut, BrowserView } = require('electron')
const path = require('path');

let mainWindow
let loadingWindow
let view
let isWindowVisible = false 

app.setName('DeepSeek4Mac');

function createTray() {
    const icon = nativeImage.createFromPath(path.join(__dirname, 'resources/icon.png'))
    tray = new Tray(icon)

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Toggle Window',
            click: () => {
                if (mainWindow.isVisible()) {
                    mainWindow.hide()
                } else {
                    mainWindow.show()
                }
            }
        },
        {
            label: 'Select Model',
            submenu: [
                {
                    label: 'DeepSeek',
                    click: () => {
                        view.webContents.loadURL("https://chat.deepseek.com");
                    }
                },
                {
                    label: 'ChatGPT',
                    click: () => {
                        view.webContents.loadURL("https://chat.openai.com");
                        view.webContents.executeJavaScript(`
                            document.addEventListener('keydown', (e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const svgElement = document.querySelector('svg.icon-2xl');
                                    
                                    if (svgElement) {
                                        const clickEvent = new MouseEvent('click', {
                                            bubbles: true,
                                            cancelable: true,
                                            view: window
                                        });
                                        svgElement.dispatchEvent(clickEvent);
                                    }
                                }
                            });
                        `);
                    }
                }
            ]
        },
        {
            label: 'Quit', 
            click: () => {
                app.quit()
            }
        },
    ])

    tray.setContextMenu(contextMenu)
}

// display loading window before site is loaded
function createLoadingWindow() {
    loadingWindow = new BrowserWindow({
        width: 150,
        height: 100,
        frame: false,
        transparent: true,
        resizable: false,
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: true,
        }
    })

    loadingWindow.loadFile(path.join(__dirname, 'pages/index.html'))
    loadingWindow.on('closed', () => { loadingWindow = null })
    globalShortcut.register('Control+Space', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide()
        } else {
            mainWindow.show()
        }
    })
}

// create and display app after site loaded
function createMainWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize

    mainWindow = new BrowserWindow({
        width: 500,
        height: 700,
        x: width - 520,
        y: height - 700,
        show: false,
        frame: false,
        resizable: true,
        alwaysOnTop: true,
        transparent: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true
        }
    })

    app.dock.hide()

    mainWindow.setTitle('DeepSeek4Mac');
    view = new BrowserView({
        webPreferences: {
            nodeIntegration: true,
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'pages/overlay.html'))
    mainWindow.webContents.on('did-finish-load', () => {
        if (loadingWindow) {
            loadingWindow.close()
        }

        const bounds = mainWindow.getBounds();
        const width = bounds.width;
        const height = bounds.height;

        mainWindow.setBrowserView(view);
        view.setBounds({ x: 0, y: 0, width, height });
        view.webContents.loadURL("https://chat.deepseek.com");
        mainWindow.show()
    })

    mainWindow.on('closed', () => { mainWindow = null })
    
    mainWindow.on('resize', () => {
        const bounds = mainWindow.getBounds();
        const width = bounds.width;
        const height = bounds.height;
    
        view.setBounds({ x: 0, y: 0, width, height });
    })
}

app.whenReady().then(() => {
    createTray()
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