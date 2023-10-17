# Electron Store IPC Bridge

This module makes it easier to use electron store in the renderer process. It
sets up an IPC bridge with a similar API to `electron-store`'s.

## Install

```
npm i lejeunerenard/electron-store-ipc-bridge
```

## Usage

### Renderer Preload Script

```js
import { contextBridge, ipcRenderer } from 'electron'
import { attachStoreRenderer } from '@lejeunerenard/electron-store-ipc-bridge'

attachStoreRenderer(contextBridge, ipcRenderer, 'store')
```

### Main Process Script

```js
import Store from 'electron-store'
import { attachStore } from '@lejeunerenard/electron-store-ipc-bridge'
const { ipcMain } = require('electron')

// Create Store
const store = new Store()

attachStore(ipcMain, store)
```

## API

`attachStore(ipc, store)` : Attaches the store to the `electron-store` in the
main process. `ipc` is the `ipcMain` provided by `electron` in the main process.
`store` is an instance of `electron-store` to attach to.

`attachStoreRenderer(contextBridge, ipcRenderer, domain = 'store')` : Attaches
the ipc to provide a store like interface on the `domain` property on `window`
by creating a context bridge to span the preload script and the rest of the
renderer. `contextBridge` is the provided context bridge from `electron`.
`ipcRenderer` is the ipc object from `electron` in the renderer preload script.
`domain` is the property on `window` that provides the `electron-store`-like
interface. By default this is `store`.
