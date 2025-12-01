import React, {useState} from 'react'
import {Pressable, StyleSheet, Text, View} from 'react-native'


export default function Counter({startingCount = 0}) {
  const [count, setCount] = useState(startingCount)

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Count: {count}</Text>
      <Pressable style={styles.btn} onPress={() => setCount(n => n + 1)}>
        <Text style={styles.btnText}>Tap Me</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    marginBottom: 12,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  btnText: {
    fontSize: 16,
    userSelect: 'none',
  },
})
