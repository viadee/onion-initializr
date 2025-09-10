import {
  __async,
  __spreadValues
} from "./chunk-IPOLEHR6.js";

// ../node_modules/@webcontainer/api/dist/internal/constants.js
var DEFAULT_EDITOR_ORIGIN = "https://stackblitz.com";

// ../node_modules/@webcontainer/api/dist/internal/TypedEventTarget.js
var TypedEventTarget = class {
  _bus = new EventTarget();
  listen(listener) {
    function wrappedListener(event) {
      listener(event.data);
    }
    this._bus.addEventListener("message", wrappedListener);
    return () => this._bus.removeEventListener("message", wrappedListener);
  }
  fireEvent(data) {
    this._bus.dispatchEvent(new MessageEvent("message", { data }));
  }
};

// ../node_modules/@webcontainer/api/dist/internal/tokens.js
var IGNORED_ERROR = new Error();
IGNORED_ERROR.stack = "";
var accessTokenChangedListeners = new TypedEventTarget();
function addAccessTokenChangedListener(listener) {
  return accessTokenChangedListeners.listen(listener);
}

// ../node_modules/@webcontainer/api/dist/internal/iframe-url.js
var params = {};
var editorOrigin = null;
var iframeSettings = {
  get editorOrigin() {
    if (editorOrigin == null) {
      editorOrigin = new URL(globalThis.WEBCONTAINER_API_IFRAME_URL ?? DEFAULT_EDITOR_ORIGIN).origin;
    }
    return editorOrigin;
  },
  set editorOrigin(newOrigin) {
    editorOrigin = new URL(newOrigin).origin;
  },
  setQueryParam(key, value) {
    params[key] = value;
  },
  get url() {
    const url = new URL(this.editorOrigin);
    url.pathname = "/headless";
    for (const param in params) {
      url.searchParams.set(param, params[param]);
    }
    url.searchParams.set("version", "1.6.1");
    return url;
  }
};

// ../node_modules/@webcontainer/api/dist/internal/reset-promise.js
function resettablePromise() {
  let resolve;
  let promise;
  function reset() {
    promise = new Promise((_resolve) => resolve = _resolve);
  }
  reset();
  return {
    get promise() {
      return promise;
    },
    resolve(value) {
      return resolve(value);
    },
    reset
  };
}

// ../node_modules/@webcontainer/api/dist/internal/auth-state.js
var authState = {
  initialized: false,
  bootCalled: false,
  authComplete: resettablePromise(),
  clientId: "",
  oauthScope: "",
  broadcastChannel: null,
  get editorOrigin() {
    return iframeSettings.editorOrigin;
  },
  tokens: null
};
var authFailedListeners = new TypedEventTarget();
var loggedOutListeners = new TypedEventTarget();
function assertAuthTokens(tokens) {
  if (!tokens) {
    throw new Error("Oops! Tokens is not defined when it always should be.");
  }
}

// ../node_modules/@webcontainer/api/dist/preview-message-types.js
var PreviewMessageType;
(function(PreviewMessageType2) {
  PreviewMessageType2["UncaughtException"] = "PREVIEW_UNCAUGHT_EXCEPTION";
  PreviewMessageType2["UnhandledRejection"] = "PREVIEW_UNHANDLED_REJECTION";
  PreviewMessageType2["ConsoleError"] = "PREVIEW_CONSOLE_ERROR";
})(PreviewMessageType || (PreviewMessageType = {}));

// ../node_modules/@webcontainer/api/dist/vendor/index.js
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var comlink_exports = {};
__export(comlink_exports, {
  createEndpoint: () => createEndpoint,
  expose: () => expose,
  proxy: () => proxy,
  proxyMarker: () => proxyMarker,
  releaseProxy: () => releaseProxy,
  transfer: () => transfer,
  transferHandlers: () => transferHandlers,
  windowEndpoint: () => windowEndpoint,
  wrap: () => wrap
});
var proxyMarker = Symbol("Comlink.proxy");
var createEndpoint = Symbol("Comlink.endpoint");
var releaseProxy = Symbol("Comlink.releaseProxy");
var throwMarker = Symbol("Comlink.thrown");
var isObject = (val) => typeof val === "object" && val !== null || typeof val === "function";
var proxyTransferHandler = {
  canHandle: (val) => isObject(val) && val[proxyMarker],
  serialize(obj) {
    const { port1, port2 } = new MessageChannel();
    expose(obj, port1);
    return [port2, [port2]];
  },
  deserialize(port) {
    port.start();
    return wrap(port);
  }
};
var throwTransferHandler = {
  canHandle: (value) => isObject(value) && throwMarker in value,
  serialize({ value }) {
    let serialized;
    if (value instanceof Error) {
      serialized = {
        isError: true,
        value: {
          message: value.message,
          name: value.name,
          stack: value.stack
        }
      };
    } else {
      serialized = { isError: false, value };
    }
    return [serialized, []];
  },
  deserialize(serialized) {
    if (serialized.isError) {
      throw Object.assign(new Error(serialized.value.message), serialized.value);
    }
    throw serialized.value;
  }
};
var transferHandlers = /* @__PURE__ */ new Map([
  ["proxy", proxyTransferHandler],
  ["throw", throwTransferHandler]
]);
function expose(obj, ep = self) {
  ep.addEventListener("message", function callback(ev) {
    if (!ev || !ev.data) {
      return;
    }
    const { id, type, path } = Object.assign({ path: [] }, ev.data);
    const argumentList = (ev.data.argumentList || []).map(fromWireValue);
    let returnValue;
    try {
      const parent = path.slice(0, -1).reduce((obj2, prop) => obj2[prop], obj);
      const rawValue = path.reduce((obj2, prop) => obj2[prop], obj);
      switch (type) {
        case 0:
          {
            returnValue = rawValue;
          }
          break;
        case 1:
          {
            parent[path.slice(-1)[0]] = fromWireValue(ev.data.value);
            returnValue = true;
          }
          break;
        case 2:
          {
            returnValue = rawValue.apply(parent, argumentList);
          }
          break;
        case 3:
          {
            const value = new rawValue(...argumentList);
            returnValue = proxy(value);
          }
          break;
        case 4:
          {
            const { port1, port2 } = new MessageChannel();
            expose(obj, port2);
            returnValue = transfer(port1, [port1]);
          }
          break;
        case 5:
          {
            returnValue = void 0;
          }
          break;
      }
    } catch (value) {
      returnValue = { value, [throwMarker]: 0 };
    }
    Promise.resolve(returnValue).catch((value) => {
      return { value, [throwMarker]: 0 };
    }).then((returnValue2) => {
      const [wireValue, transferables] = toWireValue(returnValue2);
      ep.postMessage(Object.assign(Object.assign({}, wireValue), { id }), transferables);
      if (type === 5) {
        ep.removeEventListener("message", callback);
        closeEndPoint(ep);
      }
    });
  });
  if (ep.start) {
    ep.start();
  }
}
function isMessagePort(endpoint) {
  return endpoint.constructor.name === "MessagePort";
}
function closeEndPoint(endpoint) {
  if (isMessagePort(endpoint))
    endpoint.close();
}
function wrap(ep, target) {
  return createProxy(ep, [], target);
}
function throwIfProxyReleased(isReleased) {
  if (isReleased) {
    throw new Error("Proxy has been released and is not useable");
  }
}
function createProxy(ep, path = [], target = function() {
}) {
  let isProxyReleased = false;
  const proxy2 = new Proxy(target, {
    get(_target, prop) {
      throwIfProxyReleased(isProxyReleased);
      if (prop === releaseProxy) {
        return () => {
          return requestResponseMessage(ep, {
            type: 5,
            path: path.map((p) => p.toString())
          }).then(() => {
            closeEndPoint(ep);
            isProxyReleased = true;
          });
        };
      }
      if (prop === "then") {
        if (path.length === 0) {
          return { then: () => proxy2 };
        }
        const r = requestResponseMessage(ep, {
          type: 0,
          path: path.map((p) => p.toString())
        }).then(fromWireValue);
        return r.then.bind(r);
      }
      return createProxy(ep, [...path, prop]);
    },
    set(_target, prop, rawValue) {
      throwIfProxyReleased(isProxyReleased);
      const [value, transferables] = toWireValue(rawValue);
      return requestResponseMessage(ep, {
        type: 1,
        path: [...path, prop].map((p) => p.toString()),
        value
      }, transferables).then(fromWireValue);
    },
    apply(_target, _thisArg, rawArgumentList) {
      throwIfProxyReleased(isProxyReleased);
      const last = path[path.length - 1];
      if (last === createEndpoint) {
        return requestResponseMessage(ep, {
          type: 4
        }).then(fromWireValue);
      }
      if (last === "bind") {
        return createProxy(ep, path.slice(0, -1));
      }
      const [argumentList, transferables] = processArguments(rawArgumentList);
      return requestResponseMessage(ep, {
        type: 2,
        path: path.map((p) => p.toString()),
        argumentList
      }, transferables).then(fromWireValue);
    },
    construct(_target, rawArgumentList) {
      throwIfProxyReleased(isProxyReleased);
      const [argumentList, transferables] = processArguments(rawArgumentList);
      return requestResponseMessage(ep, {
        type: 3,
        path: path.map((p) => p.toString()),
        argumentList
      }, transferables).then(fromWireValue);
    }
  });
  return proxy2;
}
function myFlat(arr) {
  return Array.prototype.concat.apply([], arr);
}
function processArguments(argumentList) {
  const processed = argumentList.map(toWireValue);
  return [processed.map((v) => v[0]), myFlat(processed.map((v) => v[1]))];
}
var transferCache = /* @__PURE__ */ new WeakMap();
function transfer(obj, transfers) {
  transferCache.set(obj, transfers);
  return obj;
}
function proxy(obj) {
  return Object.assign(obj, { [proxyMarker]: true });
}
function windowEndpoint(w, context = self, targetOrigin = "*") {
  return {
    postMessage: (msg, transferables) => w.postMessage(msg, targetOrigin, transferables),
    addEventListener: context.addEventListener.bind(context),
    removeEventListener: context.removeEventListener.bind(context)
  };
}
function toWireValue(value) {
  for (const [name, handler] of transferHandlers) {
    if (handler.canHandle(value)) {
      const [serializedValue, transferables] = handler.serialize(value);
      return [
        {
          type: 3,
          name,
          value: serializedValue
        },
        transferables
      ];
    }
  }
  return [
    {
      type: 0,
      value
    },
    transferCache.get(value) || []
  ];
}
function fromWireValue(value) {
  switch (value.type) {
    case 3:
      return transferHandlers.get(value.name).deserialize(value.value);
    case 0:
      return value.value;
  }
}
function requestResponseMessage(ep, msg, transfers) {
  return new Promise((resolve) => {
    const id = generateUUID();
    ep.addEventListener("message", function l(ev) {
      if (!ev.data || !ev.data.id || ev.data.id !== id) {
        return;
      }
      ep.removeEventListener("message", l);
      resolve(ev.data);
    });
    if (ep.start) {
      ep.start();
    }
    ep.postMessage(Object.assign({ id }, msg), transfers);
  });
}
function generateUUID() {
  return new Array(4).fill(0).map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16)).join("-");
}

// ../node_modules/@webcontainer/api/dist/utils/is-preview-message.js
var PREVIEW_MESSAGE_TYPES = [
  PreviewMessageType.ConsoleError,
  PreviewMessageType.UncaughtException,
  PreviewMessageType.UnhandledRejection
];
function isPreviewMessage(data) {
  if (data == null || typeof data !== "object") {
    return false;
  }
  if (!("type" in data) || !PREVIEW_MESSAGE_TYPES.includes(data.type)) {
    return false;
  }
  return true;
}

// ../node_modules/@webcontainer/api/dist/utils/null-prototype.js
function nullPrototype(source) {
  const prototype = /* @__PURE__ */ Object.create(null);
  if (!source) {
    return prototype;
  }
  return Object.assign(prototype, source);
}

// ../node_modules/@webcontainer/api/dist/utils/file-system.js
var binaryDecoder = new TextDecoder("latin1");
function toInternalFileSystemTree(tree) {
  const newTree = { d: {} };
  for (const name of Object.keys(tree)) {
    const entry = tree[name];
    if ("file" in entry) {
      if ("symlink" in entry.file) {
        newTree.d[name] = { f: { l: entry.file.symlink } };
        continue;
      }
      const contents = entry.file.contents;
      const stringContents = typeof contents === "string" ? contents : binaryDecoder.decode(contents);
      const binary = typeof contents === "string" ? {} : { b: true };
      newTree.d[name] = { f: __spreadValues({ c: stringContents }, binary) };
      continue;
    }
    const newEntry = toInternalFileSystemTree(entry.directory);
    newTree.d[name] = newEntry;
  }
  return newTree;
}
function toExternalFileSystemTree(tree) {
  const newTree = nullPrototype();
  if ("f" in tree) {
    throw new Error("It is not possible to export a single file in the JSON format.");
  }
  if ("d" in tree) {
    for (const name of Object.keys(tree.d)) {
      const entry = tree.d[name];
      if ("d" in entry) {
        newTree[name] = nullPrototype({
          directory: toExternalFileSystemTree(entry)
        });
      } else if ("f" in entry) {
        if ("c" in entry.f) {
          newTree[name] = nullPrototype({
            file: nullPrototype({
              contents: entry.f.b ? fromBinaryString(entry.f.c) : entry.f.c
            })
          });
        } else if ("l" in entry.f) {
          newTree[name] = nullPrototype({
            file: nullPrototype({
              symlink: entry.f.l
            })
          });
        }
      }
    }
  }
  return newTree;
}
function fromBinaryString(s) {
  const encoded = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) {
    encoded[i] = s[i].charCodeAt(0);
  }
  return encoded;
}

// ../node_modules/@webcontainer/api/dist/index.js
var bootPromise = null;
var cachedServerPromise = null;
var cachedBootOptions = {};
var decoder = new TextDecoder();
var encoder = new TextEncoder();
var WebContainer = class _WebContainer {
  _instance;
  _runtimeInfo;
  /**
   * Gives access to the underlying file system.
   */
  fs;
  /** @internal */
  static _instance = null;
  /** @internal */
  static _teardownPromise = null;
  _tornDown = false;
  _unsubscribeFromTokenChangedListener = () => {
  };
  /** @internal */
  constructor(_instance, fs, previewScript, _runtimeInfo) {
    this._instance = _instance;
    this._runtimeInfo = _runtimeInfo;
    this.fs = new FileSystemAPIClient(fs);
    if (authState.initialized) {
      this._unsubscribeFromTokenChangedListener = addAccessTokenChangedListener((accessToken) => {
        this._instance.setCredentials({ accessToken, editorOrigin: authState.editorOrigin });
      });
      (() => __async(this, null, function* () {
        yield authState.authComplete.promise;
        if (this._tornDown) {
          return;
        }
        assertAuthTokens(authState.tokens);
        yield this._instance.setCredentials({
          accessToken: authState.tokens.access,
          editorOrigin: authState.editorOrigin
        });
      }))().catch((error) => {
        console.error(error);
      });
    }
  }
  spawn(command, optionsOrArgs, options) {
    return __async(this, null, function* () {
      let args = [];
      if (Array.isArray(optionsOrArgs)) {
        args = optionsOrArgs;
      } else {
        options = optionsOrArgs;
      }
      let output = void 0;
      let outputStream = new ReadableStream();
      if (options?.output !== false) {
        const result = streamWithPush();
        output = result.push;
        outputStream = result.stream;
      }
      let stdout = void 0;
      let stdoutStream;
      let stderr = void 0;
      let stderrStream;
      const wrappedOutput = proxyListener(binaryListener(output));
      const wrappedStdout = proxyListener(binaryListener(stdout));
      const wrappedStderr = proxyListener(binaryListener(stderr));
      const process = yield this._instance.run({
        command,
        args,
        cwd: options?.cwd,
        env: options?.env,
        terminal: options?.terminal
      }, wrappedStdout, wrappedStderr, wrappedOutput);
      return new WebContainerProcessImpl(process, outputStream, stdoutStream, stderrStream);
    });
  }
  export(path, options) {
    return __async(this, null, function* () {
      const serializeOptions = {
        format: options?.format ?? "json",
        includes: options?.includes,
        excludes: options?.excludes,
        external: true
      };
      const result = yield this._instance.serialize(path, serializeOptions);
      if (serializeOptions.format === "json") {
        const data = JSON.parse(decoder.decode(result));
        return toExternalFileSystemTree(data);
      }
      return result;
    });
  }
  on(event, listener) {
    if (event === "preview-message") {
      const originalListener = listener;
      listener = ((message) => {
        if (isPreviewMessage(message)) {
          originalListener(message);
        }
      });
    }
    const { listener: wrapped, subscribe } = syncSubscription(listener);
    return subscribe(this._instance.on(event, comlink_exports.proxy(wrapped)));
  }
  /**
   * Mounts a tree of files into the filesystem. This can be specified as a tree object ({@link FileSystemTree})
   * or as a binary snapshot generated by [`@webcontainer/snapshot`](https://www.npmjs.com/package/@webcontainer/snapshot).
   *
   * @param snapshotOrTree - A tree of files, or a binary snapshot. Note that binary payloads will be transferred.
   * @param options.mountPoint - Specifies a nested path where the tree should be mounted.
   */
  mount(snapshotOrTree, options) {
    const payload = snapshotOrTree instanceof Uint8Array ? snapshotOrTree : snapshotOrTree instanceof ArrayBuffer ? new Uint8Array(snapshotOrTree) : encoder.encode(JSON.stringify(toInternalFileSystemTree(snapshotOrTree)));
    return this._instance.loadFiles(comlink_exports.transfer(payload, [payload.buffer]), {
      mountPoints: options?.mountPoint
    });
  }
  /**
   * Set a custom script to be injected into all previews. When this function is called, every
   * future page reload will contain the provided script tag on all HTML responses.
   *
   * Note:
   *
   * When this function resolves, every preview reloaded _after_ will have the new script.
   * Existing preview have to be explicitely reloaded.
   *
   * To reload a preview you can use `reloadPreview`.
   *
   * @param scriptSrc Source for the script tag.
   * @param options Options to define which type of script this is.
   */
  setPreviewScript(scriptSrc, options) {
    return this._instance.setPreviewScript(scriptSrc, options);
  }
  /**
   * The default value of the `PATH` environment variable for processes started through {@link spawn}.
   */
  get path() {
    return this._runtimeInfo.path;
  }
  /**
   * The full path to the working directory (see {@link FileSystemAPI}).
   */
  get workdir() {
    return this._runtimeInfo.cwd;
  }
  /**
   * Destroys the WebContainer instance, turning it unusable, and releases its resources. After this,
   * a new WebContainer instance can be obtained by calling {@link WebContainer.boot | `boot`}.
   *
   * All entities derived from this instance (e.g. processes, the file system, etc.) also become unusable
   * after calling this method.
   */
  teardown() {
    if (this._tornDown) {
      throw new Error("WebContainer already torn down");
    }
    this._tornDown = true;
    this._unsubscribeFromTokenChangedListener();
    const teardownFn = () => __async(this, null, function* () {
      try {
        yield this.fs._teardown();
        yield this._instance.teardown();
      } finally {
        this._instance[comlink_exports.releaseProxy]();
        if (_WebContainer._instance === this) {
          _WebContainer._instance = null;
        }
      }
    });
    _WebContainer._teardownPromise = teardownFn();
  }
  /**
   * Boots a WebContainer. Only a single instance of WebContainer can be booted concurrently
   * (see {@link WebContainer.teardown | `teardown`}).
   *
   * Booting WebContainer is an expensive operation.
   */
  static boot() {
    return __async(this, arguments, function* (options = {}) {
      yield this._teardownPromise;
      _WebContainer._teardownPromise = null;
      const { workdirName } = options;
      if (window.crossOriginIsolated && options.coep === "none") {
        console.warn(`A Cross-Origin-Embedder-Policy header is required in cross origin isolated environments.
Set the 'coep' option to 'require-corp'.`);
      }
      if (workdirName?.includes("/") || workdirName === ".." || workdirName === ".") {
        throw new Error("workdirName should be a valid folder name");
      }
      authState.bootCalled = true;
      while (bootPromise) {
        yield bootPromise;
      }
      if (_WebContainer._instance) {
        throw new Error("Only a single WebContainer instance can be booted");
      }
      const instancePromise = unsynchronizedBoot(options);
      bootPromise = instancePromise.catch(() => {
      });
      try {
        const instance = yield instancePromise;
        _WebContainer._instance = instance;
        return instance;
      } finally {
        bootPromise = null;
      }
    });
  }
};
var DIR_ENTRY_TYPE_FILE = 1;
var DIR_ENTRY_TYPE_DIR = 2;
var DirEntImpl = class {
  name;
  _type;
  constructor(name, _type) {
    this.name = name;
    this._type = _type;
  }
  isFile() {
    return this._type === DIR_ENTRY_TYPE_FILE;
  }
  isDirectory() {
    return this._type === DIR_ENTRY_TYPE_DIR;
  }
};
var FSWatcher = class {
  _apiClient;
  _path;
  _options;
  _listener;
  _wrappedListener;
  _watcher;
  _closed = false;
  constructor(_apiClient, _path, _options, _listener) {
    this._apiClient = _apiClient;
    this._path = _path;
    this._options = _options;
    this._listener = _listener;
    this._apiClient._watchers.add(this);
    this._wrappedListener = (event, filename) => {
      if (this._listener && !this._closed) {
        this._listener(event, filename);
      }
    };
    this._apiClient._fs.watch(this._path, this._options, proxyListener(this._wrappedListener)).then((_watcher) => {
      this._watcher = _watcher;
      if (this._closed) {
        return this._teardown();
      }
      return void 0;
    }).catch(console.error);
  }
  close() {
    return __async(this, null, function* () {
      if (!this._closed) {
        this._closed = true;
        this._apiClient._watchers.delete(this);
        yield this._teardown();
      }
    });
  }
  /**
   * @internal
   */
  _teardown() {
    return __async(this, null, function* () {
      yield this._watcher?.close().finally(() => {
        this._watcher?.[comlink_exports.releaseProxy]();
      });
    });
  }
};
var WebContainerProcessImpl = class {
  output;
  input;
  exit;
  _process;
  stdout;
  stderr;
  constructor(process, output, stdout, stderr) {
    this.output = output;
    this._process = process;
    this.input = new WritableStream({
      write: (data) => {
        this._getProcess()?.write(data).catch(() => {
        });
      }
    });
    this.exit = this._onExit();
    this.stdout = stdout;
    this.stderr = stderr;
  }
  kill() {
    this._process?.kill();
  }
  resize(dimensions) {
    this._getProcess()?.resize(dimensions);
  }
  _onExit() {
    return __async(this, null, function* () {
      try {
        return yield this._process.onExit;
      } finally {
        this._process?.[comlink_exports.releaseProxy]();
        this._process = null;
      }
    });
  }
  _getProcess() {
    if (this._process == null) {
      console.warn("This process already exited");
    }
    return this._process;
  }
};
var FileSystemAPIClient = class {
  _fs;
  _watchers = /* @__PURE__ */ new Set([]);
  constructor(fs) {
    this._fs = fs;
  }
  rm(...args) {
    return this._fs.rm(...args);
  }
  readFile(path, encoding) {
    return __async(this, null, function* () {
      return yield this._fs.readFile(path, encoding);
    });
  }
  rename(oldPath, newPath) {
    return __async(this, null, function* () {
      return yield this._fs.rename(oldPath, newPath);
    });
  }
  writeFile(path, data, options) {
    return __async(this, null, function* () {
      if (data instanceof Uint8Array) {
        const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
        data = comlink_exports.transfer(new Uint8Array(buffer), [buffer]);
      }
      yield this._fs.writeFile(path, data, options);
    });
  }
  readdir(path, options) {
    return __async(this, null, function* () {
      const result = yield this._fs.readdir(path, options);
      if (isStringArray(result)) {
        return result;
      }
      if (isTypedArrayCollection(result)) {
        return result;
      }
      const entries = result.map((entry) => new DirEntImpl(entry.name, entry["Symbol(type)"]));
      return entries;
    });
  }
  mkdir(path, options) {
    return __async(this, null, function* () {
      return yield this._fs.mkdir(path, options);
    });
  }
  watch(path, options, listener) {
    if (typeof options === "function") {
      listener = options;
      options = null;
    }
    return new FSWatcher(this, path, options, listener);
  }
  /**
   * @internal
   */
  _teardown() {
    return __async(this, null, function* () {
      this._fs[comlink_exports.releaseProxy]();
      yield Promise.all([...this._watchers].map((watcher) => watcher.close()));
    });
  }
};
function unsynchronizedBoot(options) {
  return __async(this, null, function* () {
    const { serverPromise } = serverFactory(options);
    const server = yield serverPromise;
    const instance = yield server.build({
      host: window.location.host,
      version: "1.6.1",
      workdirName: options.workdirName,
      forwardPreviewErrors: options.forwardPreviewErrors
    });
    const [fs, previewScript, runtimeInfo] = yield Promise.all([
      instance.fs(),
      instance.previewScript(),
      instance.runtimeInfo()
    ]);
    return new WebContainer(instance, fs, previewScript, runtimeInfo);
  });
}
function binaryListener(listener) {
  if (listener == null) {
    return void 0;
  }
  return (data) => {
    if (data instanceof Uint8Array) {
      listener(decoder.decode(data));
    } else if (data == null) {
      listener(null);
    }
  };
}
function proxyListener(listener) {
  if (listener == null) {
    return void 0;
  }
  return comlink_exports.proxy(listener);
}
function serverFactory(options) {
  if (cachedServerPromise != null) {
    if (options.coep !== cachedBootOptions.coep) {
      console.warn(`Attempting to boot WebContainer with 'coep: ${options.coep}'`);
      console.warn(`First boot had 'coep: ${cachedBootOptions.coep}', new settings will not take effect!`);
    }
    return { serverPromise: cachedServerPromise };
  }
  if (options.coep) {
    iframeSettings.setQueryParam("coep", options.coep);
  }
  if (options.experimentalNode) {
    iframeSettings.setQueryParam("experimental_node", "1");
  }
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.setAttribute("allow", "cross-origin-isolated");
  const url = iframeSettings.url;
  iframe.src = url.toString();
  const { origin } = url;
  cachedBootOptions = __spreadValues({}, options);
  cachedServerPromise = new Promise((resolve) => {
    const onMessage = (event) => {
      if (event.origin !== origin) {
        return;
      }
      const { data } = event;
      if (data.type === "init") {
        resolve(comlink_exports.wrap(event.ports[0]));
        return;
      }
      if (data.type === "warning") {
        console[data.level].call(console, data.message);
        return;
      }
    };
    window.addEventListener("message", onMessage);
  });
  document.body.insertBefore(iframe, null);
  return { serverPromise: cachedServerPromise };
}
function isStringArray(list) {
  return typeof list[0] === "string";
}
function isTypedArrayCollection(list) {
  return list[0] instanceof Uint8Array;
}
function streamWithPush() {
  let controller = null;
  const stream = new ReadableStream({
    start(controller_) {
      controller = controller_;
    }
  });
  const push = (item) => {
    if (item != null) {
      controller?.enqueue(item);
    } else {
      controller?.close();
      controller = null;
    }
  };
  return { stream, push };
}
function syncSubscription(listener) {
  let stopped = false;
  let unsubscribe = () => {
  };
  const wrapped = ((...args) => {
    if (stopped) {
      return;
    }
    listener(...args);
  });
  return {
    subscribe(promise) {
      promise.then((unsubscribe_) => {
        unsubscribe = unsubscribe_;
        if (stopped) {
          unsubscribe();
        }
      });
      return () => {
        stopped = true;
        unsubscribe();
      };
    },
    listener: wrapped
  };
}

// src/Application/Services/WebContainerManagerAppService.ts
var WebContainerManagerAppService = class {
  webcontainer = null;
  isInitialized = false;
  initialize() {
    return __async(this, null, function* () {
      if (this.webcontainer && this.isInitialized) {
        return this.webcontainer;
      }
      this.validateEnvironment();
      console.log("Cross-origin isolation enabled, initializing WebContainer...");
      this.webcontainer = yield WebContainer.boot();
      this.isInitialized = true;
      console.log("WebContainer initialized successfully");
      return this.webcontainer;
    });
  }
  reset() {
    return __async(this, null, function* () {
      console.log("Resetting WebContainer...");
      if (this.webcontainer) {
        this.webcontainer = null;
        this.isInitialized = false;
      }
      console.log(
        "WebContainer reset completed. You may need to refresh the page."
      );
    });
  }
  isReady() {
    return this.isInitialized && this.webcontainer !== null;
  }
  getWebContainer() {
    return this.webcontainer;
  }
  validateEnvironment() {
    if (!window.crossOriginIsolated) {
      throw new Error(
        "WebContainer requires cross-origin isolation. Please restart the development server and try again."
      );
    }
  }
};
export {
  WebContainerManagerAppService
};
