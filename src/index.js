import { AppRegistry } from 'react-native';
import Hello from './components/Hello';
import Counter from './components/Counter';

const defaultComponentName = 'component_1';

export const components = {
  [defaultComponentName]: Hello,
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
