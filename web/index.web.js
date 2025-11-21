import {AppRegistry, View, Text, Pressable, StyleSheet} from 'react-native'
import React from 'react'
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context'
import {
  components as exportedComponents,
  defaultComponentName,
  registerComponents,
} from '../src/index.js'

registerComponents({useSafeAreaProvider: false})

const rootTag = document.getElementById('root')

if (document && document.documentElement && rootTag) {
  document.documentElement.style.height = '100%'
  document.body.style.height = '100%'
  document.body.style.margin = '0'
  rootTag.style.height = '100%'
  rootTag.style.display = 'flex'
  rootTag.style.flexDirection = 'column'
}

const HIGHLIGHT = '#37ff95'

function WebRoot({components = {}, initialComponent}) {
  const names = Object.keys(components)
  const initial =
    initialComponent && names.includes(initialComponent)
      ? initialComponent
      : names[0]

  const [active, setActive] = React.useState(initial)
  const Active = active ? components[active] : undefined

  if (names.length === 0) {
    return (
      <SafeAreaProvider style={styles.safeAreaProvider}>
        <SafeAreaView style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>
            No components exported from index.js
          </Text>
        </SafeAreaView>
      </SafeAreaProvider>
    )
  }

  return (
    <SafeAreaProvider style={styles.safeAreaProvider}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          {names.map((name) => {
            const selected = name === active
            return (
              <Pressable
                key={name}
                onPress={() => setActive(name)}
                style={({pressed}) => [
                  styles.chipBase,
                  selected ? styles.chipSelected : styles.chipUnselected,
                  !selected && pressed && styles.chipPressed,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selected && styles.chipTextSelected,
                  ]}
                >
                  {name}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {Active ? (
          <Active/>
        ) : (
          <View style={styles.notFoundContainer}>
            <Text style={styles.notFoundText}>
              Component "{String(active)}" not found
            </Text>
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  safeAreaProvider: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },

  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
  },

  topBar: {
    backgroundColor: '#0f0f0f',
    borderBottomWidth: 1,
    borderColor: '#232323',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },

  chipBase: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    borderColor: HIGHLIGHT,
    backgroundColor: 'rgba(55, 255, 149, 0.14)',
  },
  chipUnselected: {
    borderColor: '#2a2a2a',
    backgroundColor: 'transparent',
  },
  chipPressed: {
    backgroundColor: '#1a1a1a',
  },
  chipText: {
    color: '#e5e5e5',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: HIGHLIGHT,
    fontWeight: '600',
  },

  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 16,
  },
})

const WEB_APP_NAME = 'web_root'

AppRegistry.registerComponent(WEB_APP_NAME, () => WebRoot)

AppRegistry.runApplication(WEB_APP_NAME, {
  rootTag,
  initialProps: {
    components: exportedComponents,
    initialComponent: defaultComponentName,
  },
})
