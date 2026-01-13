import { useEffect, useRef } from 'react'
import FetchEventSource from './event-source'

// Firebase project mappings (fallback when brand.firebaseProject is not loaded)
const FIREBASE_URL_MAP = {
  // Test environment
  'choicely-test-eu':
    'choicely-studio-test-default-rtdb.europe-west1.firebasedatabase.app',
  'choicely-test-usa':
    'choicely-studio-test-default-rtdb.europe-west1.firebasedatabase.app',
  // Production environment
  'choicely-studio':
    'choicely-studio-default-rtdb.europe-west1.firebasedatabase.app'
}

const useFirebaseRealtimeListener = (
  appKey,
  firebaseUrl,
  onUpdate,
  credentials,
  brandId
) => {
  const eventSourceRef = useRef(null)
  const onUpdateRef = useRef(onUpdate)

  // Keep onUpdateRef current without triggering effect re-run
  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  useEffect(() => {
    // Basic validation
    if (!appKey) {
      console.log('[Firebase Listener] No appKey provided')
      return
    }

    // Determine Firebase URL - try provided URL, then check mapping by project ID from appKey
    let resolvedFirebaseUrl = firebaseUrl

    if (!resolvedFirebaseUrl) {
      // Try to extract project from app key (format: base64(projectId/apps/appId))
      try {
        const decoded = atob(appKey)
        const projectMatch = decoded.match(/^([^/]+)/)
        if (projectMatch) {
          const projectId = projectMatch[1]
          // Direct mapping
          if (FIREBASE_URL_MAP[projectId]) {
            resolvedFirebaseUrl = FIREBASE_URL_MAP[projectId]
            console.log('[Firebase Listener] Resolved URL for project:', projectId)
          } else {
            console.log(
              '[Firebase Listener] No mapping found for project:',
              projectId
            )
          }
        }
      } catch (e) {
        console.warn('[Firebase Listener] Could not decode app key:', e)
      }
    }

    if (!resolvedFirebaseUrl) {
      console.log('[Firebase Listener] No Firebase URL available')
      return
    }

    // Clean URL and construct endpoint
    const baseUrl = resolvedFirebaseUrl.startsWith('http')
      ? resolvedFirebaseUrl
      : `https://${resolvedFirebaseUrl}`

    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl

    // Listen to the specific app node
    const url = `${cleanBaseUrl}/apps/${appKey}.json`

    const headers = {
      Accept: 'text/event-stream'
    }

    console.log('[Firebase Listener] Connecting to:', url.substring(0, 80) + '...')

    const initEventSource = () => {
      try {
        const eventSource = new FetchEventSource(url, { headers })
        eventSourceRef.current = eventSource

        eventSource.onopen = () => {
          console.log('[Firebase Listener] ✓ Connected')
        }

        eventSource.onmessage = event => {
          try {
            const data = JSON.parse(event.data.trim())

            // Firebase keep-alive sends null, ignore it
            if (data === null) return

            // If we receive a valid update (put/patch), trigger the reload
            if (data.path !== undefined && data.data !== undefined) {
              console.log('[Firebase Listener] 🔄 Update detected, reloading...')
              if (onUpdateRef.current) {
                onUpdateRef.current()
              }
            }
          } catch (e) {
            // Ignore parse errors
          }
        }

        eventSource.onerror = err => {
          console.warn('[Firebase Listener] ⚠️ Stream error:', err)
        }
      } catch (error) {
        console.error('[Firebase Listener] ❌ Failed to initialize:', error)
      }
    }

    initEventSource()

    return () => {
      console.log('[Firebase Listener] Disconnecting...')
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
    // Only re-run if appKey or firebaseUrl changes.
    // brandId and credentials might change but usually shouldn't trigger a reconnect unless URL changes.
  }, [appKey, firebaseUrl])
}

export default useFirebaseRealtimeListener

