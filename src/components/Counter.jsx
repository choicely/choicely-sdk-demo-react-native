import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type CounterProps = {
  startingCount?: number;
};

export default function Counter({ startingCount = 0 }: CounterProps) {
  const [count, setCount] = useState(startingCount);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Count: {count}</Text>
        <Pressable style={styles.btn} onPress={() => setCount(n => n + 1)}>
          <Text style={styles.btnText}>Tap Me</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
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
  },
});
