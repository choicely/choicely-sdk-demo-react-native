import React from 'react'
import {StyleSheet, View} from 'react-native'
import Video from 'react-native-video'

export default function VideoPlayer({url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'}) {
  return (
    <View style={styles.container}>
      <Video
        source={{uri: url}}
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
    ...StyleSheet.absoluteFill,
  },
})

export const rootOptions = {
  disableScrollView: true,
}
