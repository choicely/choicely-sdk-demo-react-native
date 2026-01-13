class FetchEventSource {
  constructor(url, { headers = {}, signal, method = 'GET', body = null } = {}) {
    this.url = url
    this.headers = headers
    this.signal = signal
    this.method = method
    this.body = body
    this.controller = new AbortController()

    this.onopen = null
    this.onmessage = null
    this.onerror = null

    this.init()
  }

  async init() {
    try {
      const response = await fetch(this.url, {
        method: this.method,
        headers: this.headers,
        body: this.body,
        signal: this.controller.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      this._safeCallback('onopen')

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''
      let eventData = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        let lines = buffer.split('\n')
        buffer = lines.pop()

        for (let line of lines) {
          line = line.trim()

          if (line === '') {
            if (eventData !== '') {
              this._safeCallback('onmessage', { data: eventData })
              eventData = ''
            }
            continue
          }

          if (line.startsWith('data:')) {
            const dataLine = line.slice(5).trimStart()
            eventData += dataLine + '\n'
          }
        }
      }

      if (eventData !== '') {
        this._safeCallback('onmessage', { data: eventData })
      }
    } catch (error) {
      if (
        this.controller.signal.aborted ||
        (this.signal && this.signal.aborted)
      ) {
        return
      }

      this._safeCallback('onerror', error)
    }
  }

  _safeCallback(handlerName, event) {
    if (typeof this[handlerName] === 'function') {
      this[handlerName](event)
    }
  }

  close() {
    this.controller.abort()
  }
}

export default FetchEventSource
