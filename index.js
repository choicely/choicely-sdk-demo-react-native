import { AppRegistry } from 'react-native';
import TicTacToe from './src/components/Hello';
import Counter from './src/components/Counter';

const defaultComponentName = 'component_1';

export const components = {
  [defaultComponentName]: TicTacToe,
  component_2: Counter,
};

let _registered = false;
export function registerComponents() {
  if (_registered) return;
  Object.entries(components).forEach(([name, Comp]) => {
    AppRegistry.registerComponent(name, () => Comp);
  });
  _registered = true;
}

registerComponents();

export default defaultComponentName;
