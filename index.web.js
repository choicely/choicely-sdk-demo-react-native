import { AppRegistry } from 'react-native';
import { View, Text, Button, Pressable } from 'react-native';
import React from 'react';
import { components as exportedComponents, defaultComponentName, registerComponents } from './index.js';

registerComponents()

function WebRoot({ components = {}, initialComponent }) {
  const HIGHLIGHT = '#37ff95';

  const names = Object.keys(components);
  const initial =
    initialComponent && names.includes(initialComponent)
      ? initialComponent
      : names[0];

  const [active, setActive] = React.useState(initial);
  const Active = active ? components[active] : undefined;

  if (names.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>No components exported from index.js</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          backgroundColor: '#0f0f0f',
          borderBottomWidth: 1,
          borderColor: '#232323',
          paddingHorizontal: 12,
          paddingVertical: 8,
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {names.map((name) => {
          const selected = name === active;
          return (
            <Pressable
              key={name}
              onPress={() => setActive(name)}
              style={({ pressed }) => [
                {
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  borderWidth: 1,
                  marginRight: 8,
                  marginBottom: 8,
                },
                selected
                  ? { borderColor: HIGHLIGHT, backgroundColor: 'rgba(55,255,149,0.14)' }
                  : { borderColor: '#2a2a2a', backgroundColor: pressed ? '#1a1a1a' : 'transparent' },
              ]}
            >
              <Text style={{ color: selected ? HIGHLIGHT : '#e5e5e5', fontWeight: selected ? '600' : '500' }}>
                {name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View>
        {Active ? <Active /> : <Text>Component "{String(active)}" not found</Text>}
      </View>
    </View>
  );
}

const WEB_APP_NAME = 'web_root';
AppRegistry.registerComponent(WEB_APP_NAME, () => WebRoot);

AppRegistry.runApplication(WEB_APP_NAME, {
  rootTag: document.getElementById('root'),
  initialProps: {
    components: exportedComponents,
    initialComponent: defaultComponentName,
  },
});
