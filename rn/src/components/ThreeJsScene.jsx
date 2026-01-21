import React, {useEffect, useMemo, useRef, useState} from 'react'
import {Platform, Pressable, StyleSheet, Text, TextInput, View} from 'react-native'

function safeJsonParse(value) {
  if (typeof value !== 'string') return null
  try {
    return JSON.parse(value)
  } catch (e) {
    return null
  }
}

function clampNumber(value, {min, max, fallback}) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

function normalizeHexColor(value, fallback) {
  if (typeof value !== 'string') return fallback
  const s = value.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase()
  return fallback
}

function buildConfig({backgroundColor, cubeColor, rotationSpeed}) {
  return {
    backgroundColor: normalizeHexColor(backgroundColor, '#0b1220'),
    cubeColor: normalizeHexColor(cubeColor, '#44aaff'),
    rotationSpeed: clampNumber(rotationSpeed, {min: 0, max: 8, fallback: 0.8}),
  }
}

function createThreeHtml({initialConfig}) {
  const threeModuleUrls = [
    'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js',
    'https://unpkg.com/three@0.161.0/build/three.module.js',
  ]
  const initialConfigJson = JSON.stringify(initialConfig)

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>three.js scene</title>
    <style>
      html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #000; }
      #root { position: fixed; inset: 0; }
      canvas { width: 100%; height: 100%; display: block; touch-action: none; }
      #badge {
        position: fixed;
        left: 10px;
        top: 10px;
        z-index: 10;
        padding: 6px 8px;
        font: 12px/1.2 -apple-system, system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        color: rgba(255,255,255,0.92);
        background: rgba(0,0,0,0.35);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 8px;
        user-select: none;
        -webkit-user-select: none;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <div id="badge">three.js demo</div>
    <script>
      (function () {
        var config = ${initialConfigJson};

        function postToHost(message) {
          try {
            var payload = JSON.stringify(message);
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(payload);
              return;
            }
            if (window.parent && window.parent !== window && window.parent.postMessage) {
              window.parent.postMessage(message, '*');
            }
          } catch (e) {}
        }

        function onHostMessage(event) {
          var data = event && event.data;
          if (typeof data === 'string') {
            try { data = JSON.parse(data); } catch (e) { return; }
          }
          if (!data || typeof data !== 'object' || typeof data.type !== 'string') return;

          if (data.type === 'cmd/setConfig' && data.payload && typeof data.payload === 'object') {
            config = Object.assign({}, config, data.payload);
            applyConfig();
          }

          if (data.type === 'cmd/resetCamera') {
            resetCamera();
          }
        }

        window.addEventListener('message', onHostMessage);
        document.addEventListener('message', onHostMessage);
      })();
    </script>

    <script type="module">
      const attempted = ${JSON.stringify(threeModuleUrls)};
      let loadedFrom = null;
      let THREE = null;
      let lastError = null;

      async function loadThree() {
        for (const url of attempted) {
          try {
            loadedFrom = url;
            const mod = await import(url);
            THREE = mod;
            break;
          } catch (e) {
            lastError = e;
            loadedFrom = null;
          }
        }
        if (!THREE) throw lastError || new Error('Failed to import three')
        return THREE;
      }

      function postToHost(message) {
        try {
          const payload = JSON.stringify(message);
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(payload);
            return;
          }
          if (window.parent && window.parent !== window && window.parent.postMessage) {
            window.parent.postMessage(message, '*');
          }
        } catch (e) {}
      }

      const config = ${initialConfigJson};

      try {
        const THREE_NS = await loadThree();
        window.THREE = THREE_NS;

        const root = document.getElementById('root');
        const renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        root.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
        camera.position.set(0, 0, 4);

        scene.add(new THREE.AmbientLight(0xffffff, 0.8));
        const dir = new THREE.DirectionalLight(0xffffff, 0.8);
        dir.position.set(3, 5, 4);
        scene.add(dir);

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({color: 0x44aaff});
        const cube = new THREE.Mesh(geometry, material);
        cube.name = 'cube';
        scene.add(cube);

        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();

        function resize() {
          const w = root.clientWidth || window.innerWidth || 1;
          const h = root.clientHeight || window.innerHeight || 1;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        }

        function resetCamera() {
          camera.position.set(0, 0, 4);
          camera.lookAt(0, 0, 0);
        }

        function applyConfig() {
          const bg = typeof config.backgroundColor === 'string' ? config.backgroundColor : '#000000';
          scene.background = new THREE.Color(bg);

          const cubeColor = typeof config.cubeColor === 'string' ? config.cubeColor : '#44aaff';
          cube.material.color = new THREE.Color(cubeColor);

          let speed = Number(config.rotationSpeed);
          if (!isFinite(speed)) speed = 0.8;
          config.rotationSpeed = speed;
        }

        function onPointerDown(e) {
          const rect = renderer.domElement.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
          pointer.set(x, y);
          raycaster.setFromCamera(pointer, camera);
          const hits = raycaster.intersectObjects(scene.children, true);
          if (hits && hits.length > 0) {
            const hit = hits[0];
            postToHost({
              type: 'event/pick',
              payload: {
                name: hit.object && hit.object.name ? hit.object.name : 'object',
                point: {x: hit.point.x, y: hit.point.y, z: hit.point.z},
              },
            });
          }
        }

        renderer.domElement.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('resize', resize);

        applyConfig();
        resize();
        postToHost({
          type: 'event/ready',
          payload: {renderer: 'webgl', threeVersion: THREE.REVISION, loadedFrom: loadedFrom},
        });

        let lastTime = performance.now();
        function tick(now) {
          const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
          lastTime = now;
          resize();

          let speed = Number(config.rotationSpeed);
          if (!isFinite(speed)) speed = 0.8;
          cube.rotation.y += dt * speed;
          cube.rotation.x += dt * (speed * 0.6);

          renderer.render(scene, camera);
          requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);

        window.__THREE_SCENE__ = {applyConfig: applyConfig, resetCamera: resetCamera};
      } catch (e) {
        postToHost({
          type: 'event/error',
          payload: {
            message: 'three.js module import failed in WebView.',
            attempted: attempted,
            loadedFrom: loadedFrom,
            error: String(e && (e.message || e) || e),
          },
        });
      }
    </script>
  </body>
</html>`
}

export const rootOptions = {disableScrollView: true}

export default function ThreeJsScene({
  title = 'Three.js (parity demo)',
  backgroundColor = '#0b1220',
  cubeColor = '#44aaff',
  rotationSpeed = '0.8',
}) {
  const webViewRef = useRef(null)
  const canvasHostRef = useRef(null)
  const webSceneRef = useRef(null)

  const [isSceneReady, setIsSceneReady] = useState(false)
  const [statusText, setStatusText] = useState('Loading…')
  const [pickedText, setPickedText] = useState('')

  const [bg, setBg] = useState(backgroundColor)
  const [cube, setCube] = useState(cubeColor)
  const [speed, setSpeed] = useState(rotationSpeed)

  const initialConfig = useMemo(() => {
    return buildConfig({backgroundColor, cubeColor, rotationSpeed})
  }, [backgroundColor, cubeColor, rotationSpeed])

  const html = useMemo(() => createThreeHtml({initialConfig}), [initialConfig])

  function applyConfigToScene() {
    const nextConfig = buildConfig({backgroundColor: bg, cubeColor: cube, rotationSpeed: speed})

    if (Platform.OS === 'web') {
      webSceneRef.current?.applyConfig?.(nextConfig)
      return
    }

    const payload = JSON.stringify({type: 'cmd/setConfig', payload: nextConfig})
    webViewRef.current?.postMessage?.(payload)
  }

  function resetCamera() {
    if (Platform.OS === 'web') {
      webSceneRef.current?.resetCamera?.()
      return
    }

    const payload = JSON.stringify({type: 'cmd/resetCamera'})
    webViewRef.current?.postMessage?.(payload)
  }

  useEffect(() => {
    if (!isSceneReady) return
    applyConfigToScene()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSceneReady])

  useEffect(() => {
    if (Platform.OS !== 'web') return

    const host = canvasHostRef.current
    if (!host) return

    let cleanup = null

    ;(async () => {
      try {
        const THREE = await import('three')

        const renderer = new THREE.WebGLRenderer({antialias: true, alpha: false})
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        renderer.domElement.style.width = '100%'
        renderer.domElement.style.height = '100%'
        renderer.domElement.style.display = 'block'
        host.appendChild(renderer.domElement)

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000)
        camera.position.set(0, 0, 4)

        scene.add(new THREE.AmbientLight(0xffffff, 0.8))
        const dir = new THREE.DirectionalLight(0xffffff, 0.8)
        dir.position.set(3, 5, 4)
        scene.add(dir)

        const cubeMesh = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          new THREE.MeshStandardMaterial({color: 0x44aaff}),
        )
        cubeMesh.name = 'cube'
        scene.add(cubeMesh)

        const raycaster = new THREE.Raycaster()
        const pointer = new THREE.Vector2()

        function resize() {
          const rect = host.getBoundingClientRect()
          const w = Math.max(1, Math.floor(rect.width))
          const h = Math.max(1, Math.floor(rect.height))
          renderer.setSize(w, h, false)
          camera.aspect = w / h
          camera.updateProjectionMatrix()
        }

        function resetCameraImpl() {
          camera.position.set(0, 0, 4)
          camera.lookAt(0, 0, 0)
        }

        const state = {rotationSpeed: initialConfig.rotationSpeed}

        function applyConfig(config) {
          const bgColor = typeof config.backgroundColor === 'string' ? config.backgroundColor : '#000000'
          scene.background = new THREE.Color(bgColor)

          const cubeColorValue = typeof config.cubeColor === 'string' ? config.cubeColor : '#44aaff'
          cubeMesh.material.color = new THREE.Color(cubeColorValue)

          const s = Number(config.rotationSpeed)
          state.rotationSpeed = Number.isFinite(s) ? s : 0.8
        }

        function onPointerDown(e) {
          const rect = renderer.domElement.getBoundingClientRect()
          const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
          const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
          pointer.set(x, y)
          raycaster.setFromCamera(pointer, camera)
          const hits = raycaster.intersectObjects(scene.children, true)
          if (hits && hits.length > 0) {
            const hit = hits[0]
            const name = hit?.object?.name || 'object'
            setPickedText(`Picked: ${name}`)
          }
        }

        renderer.domElement.addEventListener('pointerdown', onPointerDown)

        let resizeObserver = null
        if (typeof ResizeObserver !== 'undefined') {
          resizeObserver = new ResizeObserver(() => resize())
          resizeObserver.observe(host)
        } else {
          window.addEventListener('resize', resize)
        }

        applyConfig(initialConfig)
        resize()

        setIsSceneReady(true)
        setStatusText(`Ready (webgl, three r${THREE.REVISION || 'unknown'})`)

        let raf = 0
        let lastTime = performance.now()
        const tick = (now) => {
          const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000))
          lastTime = now
          cubeMesh.rotation.y += dt * state.rotationSpeed
          cubeMesh.rotation.x += dt * (state.rotationSpeed * 0.6)
          renderer.render(scene, camera)
          raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)

        webSceneRef.current = {applyConfig, resetCamera: resetCameraImpl}

        cleanup = () => {
          try {
            if (raf) cancelAnimationFrame(raf)
            renderer.domElement.removeEventListener('pointerdown', onPointerDown)
            if (resizeObserver) resizeObserver.disconnect()
            else window.removeEventListener('resize', resize)
            renderer.dispose()
            if (renderer.domElement && renderer.domElement.parentNode === host) {
              host.removeChild(renderer.domElement)
            }
          } catch (e) {}
          webSceneRef.current = null
        }
      } catch (e) {
        setStatusText(`Error: ${String(e?.message || e)}`)
      }
    })()

    return () => {
      if (cleanup) cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSceneMessage(msg) {
    if (!msg || typeof msg.type !== 'string') return

    if (msg.type === 'event/ready') {
      setIsSceneReady(true)
      setStatusText(`Ready (${msg?.payload?.renderer || 'renderer'})`)
      return
    }

    if (msg.type === 'event/pick') {
      const name = msg?.payload?.name || 'object'
      setPickedText(`Picked: ${name}`)
      return
    }

    if (msg.type === 'event/error') {
      setStatusText(`Error: ${msg?.payload?.message || 'unknown error'}`)
    }
  }

  const SceneHost = useMemo(() => {
    if (Platform.OS === 'web') return null
    return require('react-native-webview').WebView
  }, [])

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subTitle}>
          Same scene code runs as HTML/JS: iframe on web, WebView on iOS/Android
        </Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.row}>
          <Text style={styles.label}>Background</Text>
          <TextInput
            value={bg}
            onChangeText={setBg}
            placeholder="#0b1220"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Cube</Text>
          <TextInput
            value={cube}
            onChangeText={setCube}
            placeholder="#44aaff"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Speed</Text>
          <TextInput
            value={String(speed)}
            onChangeText={setSpeed}
            placeholder="0.8"
            keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.button} onPress={applyConfigToScene}>
            <Text style={styles.buttonText}>Apply</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={resetCamera}>
            <Text style={styles.buttonText}>Reset Camera</Text>
          </Pressable>
        </View>

        <Text style={styles.status} numberOfLines={2}>
          {statusText}
          {pickedText ? ` • ${pickedText}` : ''}
        </Text>
      </View>

      <View style={styles.scene}>
        {Platform.OS === 'web' ? (
          <View ref={canvasHostRef} style={styles.canvasHost} />
        ) : (
          <SceneHost
            ref={webViewRef}
            originWhitelist={['*']}
            source={{html}}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            onMessage={(e) => {
              const msg = safeJsonParse(e?.nativeEvent?.data)
              if (!msg) return
              handleSceneMessage(msg)
            }}
            style={styles.webview}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 4,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  subTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  controls: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    width: 92,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
  },
  input: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#ffffff',
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  status: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  scene: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  canvasHost: {
    flex: 1,
    backgroundColor: '#000000',
  },
})
