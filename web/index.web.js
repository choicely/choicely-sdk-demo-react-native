import { AppRegistry, View, Text, Pressable } from 'react-native';
import React from 'react';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import {
  components as exportedComponents,
  defaultComponentName,
  registerComponents,
} from '../src/index.js';

registerComponents({ useSafeAreaProvider: false });

const rootTag = document.getElementById('root');

// Make the page fill the viewport and let #root be a flex container
if (document && document.documentElement && rootTag) {
  document.documentElement.style.height = '100%';

  document.body.style.height = '100%';
  document.body.style.margin = '0';

  rootTag.style.height = '100%';
  rootTag.style.display = 'flex';
  rootTag.style.flexDirection = 'column';
}

function WebRoot({ components = {}, initialComponent }) {
  const HIGHLIGHT = '#37ff95';

  const names = Object.keys(components);
  const initial =
    initialComponent && names.includes(initialComponent)
      ? initialComponent
      : names[0];

  const [active, setActive] = React.useState(initial);
  const Active = active ? components[active] : undefined;

  // No components exported case
  if (names.length === 0 || true) {
    return (
      <SafeAreaProvider style={{ flex: 1 }}>
        <SafeAreaView style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center', }}>
            <Text>No components exported from index.js</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Top bar */}
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
                    ? {
                        borderColor: HIGHLIGHT,
                        backgroundColor: 'rgba(55, 255, 149, 0.14)',
                      }
                    : {
                        borderColor: '#2a2a2a',
                        backgroundColor: pressed ? '#1a1a1a' : 'transparent',
                      },
                ]}
              >
                <Text
                  style={{
                    color: selected ? HIGHLIGHT : '#e5e5e5',
                    fontWeight: selected ? '600' : '500',
                  }}
                >
                  {name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Full-screen app area */}
        <View style={{ flex: 1 }}>
          {Active ? (
            <Active />
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text>Component "{String(active)}" not found</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const WEB_APP_NAME = 'web_root';

AppRegistry.registerComponent(WEB_APP_NAME, () => WebRoot);

AppRegistry.runApplication(WEB_APP_NAME, {
  rootTag,
  initialProps: {
    components: exportedComponents,
    initialComponent: defaultComponentName,
  },
});
