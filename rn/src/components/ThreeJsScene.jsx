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

function createThreeHtml({initialConfig}) {
  const threeCdnUrl = 'https://unpkg.com/three@0.161.0/build/three.min.js'
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
    <script src="${threeCdnUrl}"></script>
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

        if (!window.THREE) {
          postToHost({type: 'event/error', payload: {message: 'three.js failed to load (no THREE global)'}});
          return;
        }

        var root = document.getElementById('root');
        var renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        root.appendChild(renderer.domElement);

        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
        camera.position.set(0, 0, 4);

        var ambient = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambient);

        var dir = new THREE.DirectionalLight(0xffffff, 0.8);
        dir.position.set(3, 5, 4);
        scene.add(dir);

        var geometry = new THREE.BoxGeometry(1, 1, 1);
        var material = new THREE.MeshStandardMaterial({color: 0x44aaff});
        var cube = new THREE.Mesh(geometry, material);
        cube.name = 'cube';
        scene.add(cube);

        var raycaster = new THREE.Raycaster();
        var pointer = new THREE.Vector2();

        function resize() {
          var w = root.clientWidth || window.innerWidth || 1;
          var h = root.clientHeight || window.innerHeight || 1;
          if (renderer.domElement.width !== w || renderer.domElement.height !== h) {
            renderer.setSize(w, h, false);
          }
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        }

        function resetCamera() {
          camera.position.set(0, 0, 4);
          camera.lookAt(0, 0, 0);
        }

        function applyConfig() {
          var bg = typeof config.backgroundColor === 'string' ? config.backgroundColor : '#000000';
          scene.background = new THREE.Color(bg);

          var cubeColor = typeof config.cubeColor === 'string' ? config.cubeColor : '#44aaff';
          cube.material.color = new THREE.Color(cubeColor);

          var speed = Number(config.rotationSpeed);
          if (!isFinite(speed)) speed = 0.8;
          config.rotationSpeed = speed;
        }

        function onPointerDown(e) {
          var rect = renderer.domElement.getBoundingClientRect();
          var x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          var y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
          pointer.set(x, y);
          raycaster.setFromCamera(pointer, camera);
          var hits = raycaster.intersectObjects(scene.children, true);
          if (hits && hits.length > 0) {
            var hit = hits[0];
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
        postToHost({type: 'event/ready', payload: {renderer: 'webgl', threeVersion: THREE.REVISION}});

        var lastTime = performance.now();
        function tick(now) {
          var dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
          lastTime = now;
          resize();

          var speed = Number(config.rotationSpeed);
          if (!isFinite(speed)) speed = 0.8;
          cube.rotation.y += dt * speed;
          cube.rotation.x += dt * (speed * 0.6);

          renderer.render(scene, camera);
          requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      })();
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
  const iframeRef = useRef(null)

  const [isSceneReady, setIsSceneReady] = useState(false)
  const [statusText, setStatusText] = useState('Loading…')
  const [pickedText, setPickedText] = useState('')

  const [bg, setBg] = useState(backgroundColor)
  const [cube, setCube] = useState(cubeColor)
  const [speed, setSpeed] = useState(rotationSpeed)

  const initialConfig = useMemo(() => {
    return {
      backgroundColor: normalizeHexColor(backgroundColor, '#0b1220'),
      cubeColor: normalizeHexColor(cubeColor, '#44aaff'),
      rotationSpeed: clampNumber(rotationSpeed, {min: 0, max: 8, fallback: 0.8}),
    }
  }, [backgroundColor, cubeColor, rotationSpeed])

  const html = useMemo(() => createThreeHtml({initialConfig}), [initialConfig])

  function sendToScene(message) {
    if (!message || typeof message.type !== 'string') return

    if (Platform.OS === 'web') {
      const win = iframeRef.current?.contentWindow
      if (!win) return
      win.postMessage(message, '*')
      return
    }

    const payload = JSON.stringify(message)
    webViewRef.current?.postMessage?.(payload)
  }

  function applyConfigToScene() {
    const nextConfig = {
      backgroundColor: normalizeHexColor(bg, '#0b1220'),
      cubeColor: normalizeHexColor(cube, '#44aaff'),
      rotationSpeed: clampNumber(speed, {min: 0, max: 8, fallback: 0.8}),
    }
    sendToScene({type: 'cmd/setConfig', payload: nextConfig})
  }

  useEffect(() => {
    if (!isSceneReady) return
    applyConfigToScene()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSceneReady])

  useEffect(() => {
    if (Platform.OS !== 'web') return

    function onMessage(event) {
      const data = event?.data
      if (!data || typeof data !== 'object' || typeof data.type !== 'string') return
      handleSceneMessage(data)
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
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
          <Pressable style={styles.button} onPress={() => sendToScene({type: 'cmd/resetCamera'})}>
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
          // react-native-web supports direct DOM elements
          <iframe
            ref={iframeRef}
            title="three-js-scene"
            sandbox="allow-scripts allow-same-origin"
            style={styles.iframe}
            srcDoc={html}
          />
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
  iframe: {
    borderWidth: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
})

