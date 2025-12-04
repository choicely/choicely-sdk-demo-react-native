import React from 'react'
import {AppRegistry, ScrollView} from 'react-native'
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context'

const defaultComponentName = 'hello'

export const components = {
  [defaultComponentName]: require('./components/Hello').default,
  counter: require('./components/Counter').default,
  video_player: require('./components/VideoPlayer').default,
  tic_tac_toe: require('./components/TicTacToe').default,
}


function wrapWithSafeAreaProvider(Component) {
  return function WrappedWithSafeAreaProvider(props) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{flex: 1}}>
          <ScrollView contentContainerStyle={{flexGrow: 1}}>
            <Component {...props} />
          </ScrollView>
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
