import React from 'react'
import {StyleSheet, View} from 'react-native'
import Video from 'react-native-video'

export default function VideoPlayer() {
  return (
    <View style={styles.container}>
      <Video
        source={{uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'}}
        style={styles.video}
        controls={true}
        resizeMode="contain"
        paused={true}
      />
    </View>
  )
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  video: {
    width: '100%',
    height: '100%',
  },
})
