import test from 'tape'
import Store from 'electron-store'
import { tmpdir } from 'os'
import { EventEmitter } from 'events'

import { attachStore, attachStoreRenderer } from '../index.js'

const makeStore = () => {
  const cwd = tmpdir()
  const name = Math.random()
  return new Store({ cwd, name })
}

class TestIPC extends EventEmitter {
  send (event, ...args) {
    const eventObj = {
      reply: (event, ...args) => {
        this.emit(event, {}, ...args)
      }
    }
    this.emit(event, eventObj, ...args)
  }

  sendSync (event, ...args) {
    let value
    const eventObj = {
      // eslint-disable-next-line accessor-pairs
      set returnValue (v) { value = v },
      reply: (event, ...args) => {
        this.emit(event, ...args)
      }
    }
    this.emit(event, eventObj, ...args)
    return value
  }
}

test('attachStore', (t) => {
  t.test('basic', (t) => {
    t.plan(5)
    const ipc = new TestIPC()
    const store = makeStore()
    attachStore(ipc, store)

    // 'Set' event
    t.equal(store.get('foo'), undefined, 'store is empty after invoking')
    ipc.send('electron:store:set', 'foo', 'bar')
    t.equal(store.get('foo'), 'bar', 'foo is set')

    // 'Get' event
    const fooGet = ipc.sendSync('electron:store:get', 'foo')
    t.equal(fooGet, 'bar', 'get foo value via sendSync')

    // 'onDidChange' event
    ipc.once('electron:store:onDidChange:foo', (event, next, prev) => {
      t.equal(prev, 'bar', 'got previous value')
      t.equal(next, 'beep', 'got next value')
    })
    ipc.send('electron:store:onDidChange', 'foo')
    ipc.send('electron:store:set', 'foo', 'beep')
  })

  t.test('custom namespace', (t) => {
    t.plan(5)
    const ipc = new TestIPC()
    const store = makeStore()
    const ns = 'baz'
    attachStore(ipc, store, ns)

    // 'Set' event
    t.equal(store.get('foo'), undefined, 'store is empty after invoking')
    ipc.send(`${ns}:set`, 'foo', 'bar')
    t.equal(store.get('foo'), 'bar', 'foo is set')

    // 'Get' event
    const fooGet = ipc.sendSync(`${ns}:get`, 'foo')
    t.equal(fooGet, 'bar', 'get foo value via sendSync')

    // 'onDidChange' event
    ipc.once(`${ns}:onDidChange:foo`, (event, next, prev) => {
      t.equal(prev, 'bar', 'got previous value')
      t.equal(next, 'beep', 'got next value')
    })
    ipc.send(`${ns}:onDidChange`, 'foo')
    ipc.send(`${ns}:set`, 'foo', 'beep')
  })
})

test('attachStoreRenderer', (t) => {
  t.test('basic', (t) => {
    t.plan(5)
    const ipc = new TestIPC()
    const store = makeStore()

    const myGlobal = {}
    const contextBridge = {
      exposeInMainWorld (domain, obj) {
        myGlobal[domain] = obj
      }
    }

    attachStore(ipc, store)
    attachStoreRenderer(contextBridge, ipc, 'rendererStore')

    // 'Set' event
    t.equal(store.get('foo'), undefined, 'store is empty')
    myGlobal.rendererStore.set('foo', 'bar')
    t.equal(store.get('foo'), 'bar', 'foo is set')

    // 'Get' event
    const fooGet = myGlobal.rendererStore.get('foo')
    t.equal(fooGet, 'bar', 'get foo value')

    // 'onDidChange' event
    myGlobal.rendererStore.onDidChange('foo', (next, prev) => {
      t.equal(prev, 'bar', 'got previous value')
      t.equal(next, 'beep', 'got next value')
    })
    store.set('foo', 'beep')
    t.end()
  })

  t.test('custom namespace', (t) => {
    t.plan(5)
    const ipc = new TestIPC()
    const store = makeStore()

    const ns = Math.random() + ':ns'

    const myGlobal = {}
    const contextBridge = {
      exposeInMainWorld (domain, obj) {
        myGlobal[domain] = obj
      }
    }

    attachStore(ipc, store, ns)
    attachStoreRenderer(contextBridge, ipc, 'rendererStore', ns)

    // 'Set' event
    t.equal(store.get('foo'), undefined, 'store is empty')
    myGlobal.rendererStore.set('foo', 'bar')
    t.equal(store.get('foo'), 'bar', 'foo is set')

    // 'Get' event
    const fooGet = myGlobal.rendererStore.get('foo')
    t.equal(fooGet, 'bar', 'get foo value')

    // 'onDidChange' event
    myGlobal.rendererStore.onDidChange('foo', (next, prev) => {
      t.equal(prev, 'bar', 'got previous value')
      t.equal(next, 'beep', 'got next value')
    })
    store.set('foo', 'beep')
    t.end()
  })
})