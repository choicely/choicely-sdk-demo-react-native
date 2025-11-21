import React from 'react';
import { AppRegistry } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Hello from './components/Hello';
import Counter from './components/Counter';

const defaultComponentName = 'component_1';
export const components = {
  [defaultComponentName]: Hello,
  component_2: Counter,
};

function wrapWithSafeAreaProvider(Component) {
  return function WrappedWithSafeAreaProvider(props) {
    return (
      <SafeAreaProvider>
        <Component {...props} />
      </SafeAreaProvider>
    );
  };
}

let _registered = false;

export function registerComponents({ useSafeAreaProvider = true } = {}) {
  if (_registered === true) {
    return;
  }

  Object.entries(components).forEach(([name, Comp]) => {
    const RootComponent = useSafeAreaProvider
      ? wrapWithSafeAreaProvider(Comp)
      : Comp;

    AppRegistry.registerComponent(name, () => RootComponent);
  });

  _registered = true;
}

registerComponents();

export default defaultComponentName;
