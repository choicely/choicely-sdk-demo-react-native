import {AppRegistry} from 'react-native';
import Hello from './src/components/Hello';
import Counter from './src/components/Counter';

AppRegistry.registerComponent('component_1', () => Hello);
AppRegistry.registerComponent('component_2', () => Counter);
