import React from 'react'
import {StyleSheet, View} from 'react-native'
import Video from 'react-native-video'

export default function VideoPlayer() {
  return (
    <View style={styles.container}>
      <Video
        source={{uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'}}
        style={styles.video}
        controls
        resizeMode="contain"
        paused
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
})

export const rootOptions = {
  disableScrollView: true,
}
