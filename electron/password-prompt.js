const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// M6 修复：safeStorage 不可用时弹出主密码输入窗口
// 通过 scrypt 派生密钥，避免明文存储 store.key
// @param {BrowserWindow|null} parent - 父窗口（可选）
// @param {boolean} isFirstTime - true=首次设置（提示"设置主密码"），false=已有盐值（提示"输入主密码"）
// @returns {Promise<string|null>} 密码（取消则为 null）
function showMasterPasswordPrompt(parent, isFirstTime) {
  return new Promise((resolve) => {
    let resolved = false;
    const win = new BrowserWindow({
      width: 440,
      height: 240,
      parent: parent || undefined,
      modal: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      title: isFirstTime ? '设置主密码' : '输入主密码',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        preload: path.join(__dirname, 'password-preload.js'),
      },
    });

    const title = isFirstTime ? '设置主密码' : '输入主密码';
    const desc = isFirstTime
      ? '系统密钥链不可用，需要设置主密码来加密本地数据。请妥善保管此密码，丢失后数据无法恢复。'
      : '系统密钥链不可用，请输入之前设置的主密码以解锁本地数据。';

    const html = `data:text/html;charset=utf-8,` + encodeURIComponent(`
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><style>
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; margin: 0; background: #1a1a1a; color: #e0e0e0; }
        h3 { margin: 0 0 8px 0; font-size: 16px; color: #f3c951; }
        p { margin: 0 0 14px 0; font-size: 13px; color: #a0a0a0; line-height: 1.5; }
        input { width: 100%; padding: 9px; margin-bottom: 14px; background: #2a2a2a; border: 1px solid #444; color: #e0e0e0; border-radius: 4px; font-size: 14px; outline: none; }
        input:focus { border-color: #f3c951; }
        .btns { display: flex; justify-content: flex-end; }
        button { padding: 8px 18px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; }
        .submit { background: #3b82f6; color: white; }
        .submit:hover { background: #2563eb; }
        .cancel { background: #444; color: #e0e0e0; margin-left: 8px; }
        .cancel:hover { background: #555; }
      </style></head>
      <body>
        <h3>${title}</h3>
        <p>${desc}</p>
        <input type="password" id="pwd" placeholder="主密码" autofocus>
        <div class="btns">
          <button class="submit" onclick="window.passwordPrompt.submit(document.getElementById('pwd').value)">确认</button>
          <button class="cancel" onclick="window.passwordPrompt.cancel()">退出</button>
        </div>
        <script>
          document.getElementById('pwd').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') window.passwordPrompt.submit(document.getElementById('pwd').value);
            if (e.key === 'Escape') window.passwordPrompt.cancel();
          });
        </script>
      </body>
      </html>
    `);

    win.loadURL(html);

    const isTrustedSender = event => event && event.sender === win.webContents;

    const submitHandler = (event, password) => {
      if (!isTrustedSender(event)) return;
      if (resolved) return;
      resolved = true;
      cleanup();
      win.close();
      resolve(password || '');
    };

    const cancelHandler = event => {
      if (!isTrustedSender(event)) return;
      if (resolved) return;
      resolved = true;
      cleanup();
      win.close();
      resolve(null);
    };

    const cleanup = () => {
      ipcMain.removeListener('master-password-submit', submitHandler);
      ipcMain.removeListener('master-password-cancel', cancelHandler);
    };

    ipcMain.on('master-password-submit', submitHandler);
    ipcMain.on('master-password-cancel', cancelHandler);

    win.on('closed', () => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(null);
      }
    });
  });
}

module.exports = { showMasterPasswordPrompt };
