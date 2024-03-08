export function attachStore (ipc, store, namespace = 'electron:store') {
  // IPC listener
  ipc.on(namespace + ':get', async (event, val, defaultValue) => {
    event.returnValue = store.get(val, defaultValue)
  })
  ipc.on(namespace + ':has', async (event, val) => {
    event.returnValue = store.has(val)
  })
  ipc.on(namespace + ':set', async (event, key, val) => {
    store.set(key, val)
  })
  ipc.on(namespace + ':onDidChange', async (event, key) => {
    store.onDidChange(key, (...args) => event.reply(namespace + ':onDidChange:' + key, ...args))
  })
}

export function attachStoreRenderer (contextBridge, ipcRenderer, domain = 'store', namespace = 'electron:store') {
  const store = {
    get: (key, defaultValue) => {
      return ipcRenderer.sendSync(namespace + ':get', key, defaultValue)
    },
    has: (key) => {
      return ipcRenderer.sendSync(namespace + ':has', key)
    },
    set: (property, val) => {
      ipcRenderer.send(namespace + ':set', property, val)
    },
    onDidChange: (key, func) => {
      ipcRenderer.send(namespace + ':onDidChange', key)
      ipcRenderer.on(namespace + ':onDidChange:' + key, (event, ...args) => func(...args))
    }
  }
  contextBridge.exposeInMainWorld(domain, store)

  return store
}
