import React from 'react'
import {AppRegistry} from 'react-native'
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context'

import Hello from './components/Hello'
import Counter from './components/Counter'
import VideoPlayer from './components/VideoPlayer'

const defaultComponentName = 'hello'
export const components = {
  [defaultComponentName]: Hello,
  counter: Counter,
  video_player: VideoPlayer,
}

function wrapWithSafeAreaProvider(Component) {
  return function WrappedWithSafeAreaProvider(props) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{flex: 1}}>
          <Component {...props} />
        </SafeAreaView>
      </SafeAreaProvider>
    )
  }
}

let _registered = false

export function registerComponents({useSafeAreaProvider = true} = {}) {
  if (_registered === true) {
    return
  }

  Object.entries(components).forEach(([name, Comp]) => {
    const RootComponent = useSafeAreaProvider
      ? wrapWithSafeAreaProvider(Comp)
      : Comp

    AppRegistry.registerComponent(name, () => RootComponent)
  })

  _registered = true
}

registerComponents()

export default defaultComponentName
