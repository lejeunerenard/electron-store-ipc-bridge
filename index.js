export function attachStore (ipc, store) {
  // IPC listener
  ipc.on('electron:store:get', async (event, val) => {
    event.returnValue = store.get(val)
  })
  ipc.on('electron:store:set', async (event, key, val) => {
    store.set(key, val)
  })
  ipc.on('electron:store:onDidChange', async (event, key) => {
    store.onDidChange(key, (...args) => event.reply('electron:store:onDidChange:' + key, ...args))
  })
}

export function attachStoreRenderer (contextBridge, ipcRenderer, domain = 'store') {
  contextBridge.exposeInMainWorld(domain, {
    get: (key) => {
      return ipcRenderer.sendSync('electron:store:get', key)
    },
    set: (property, val) => {
      ipcRenderer.send('electron:store:set', property, val)
    },
    onDidChange: (key, func) => {
      ipcRenderer.send('electron:store:onDidChange', key)
      ipcRenderer.on('electron:store:onDidChange:' + key, (event, ...args) => func(...args))
    }
  })
}
