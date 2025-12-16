import React from 'react'
import {AppRegistry, ScrollView} from 'react-native'
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context'

const defaultComponentName = 'hello'
export const componentMapping = {
  [defaultComponentName]: require('./components/Hello'),
  counter: require('./components/Counter'),
  video_player: require('./components/VideoPlayer'),
  tic_tac_toe: require('./components/TicTacToe'),
}

function createRootComponent(Comp, {useSafeAreaProvider, rootOptions = {}}) {
  const {disableScrollView} = rootOptions

  return function Root(props) {
    let content = <Comp {...props} />

    if (!disableScrollView) {
      content = (
        <ScrollView style={{flex: 1}} contentContainerStyle={{flexGrow: 1}}>
          {content}
        </ScrollView>
      )
    }

    if (useSafeAreaProvider) {
      return (
        <SafeAreaProvider>
          <SafeAreaView style={{flex: 1}}>
            {content}
          </SafeAreaView>
        </SafeAreaProvider>
      )
    }

    return content
  }
}

let _registered = false

export function registerComponents({useSafeAreaProvider = true} = {}) {
  if (_registered === true) {
    return
  }

  Object.entries(componentMapping).forEach(([name, compModule]) => {
    if (compModule == null) {
      return
    }
    const Comp = compModule.default
    const rootOptions = compModule.rootOptions ?? {}

    const RootComponent = createRootComponent(Comp, {
      useSafeAreaProvider,
      rootOptions,
    })
    componentMapping[name] = {
      ...compModule,
      registeredComponent: RootComponent,
    }
    AppRegistry.registerComponent(name, () => RootComponent)
  })

  _registered = true
}

registerComponents()

export default defaultComponentName
