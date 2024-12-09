import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Button,
  TextInput,
  Text,
  NativeEventEmitter,
  NativeModules,
} from 'react-native';
import {
  startService,
  stopService,
  PushedEventTypes,
  Push,
} from 'pushed-react-native';
import notifee from '@notifee/react-native';

export default function App() {
  const [serviceStarted, setServiceStarted] = useState(false);
  const [token, setToken] = useState('');

  async function onDisplayNotification(push: Push) {
    // Request permissions (required for iOS)
    await notifee.requestPermission()

    // Create a channel (required for Android)
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
    });

    // Display a notification
    await notifee.displayNotification({
      title: 'Notification Title',
      body: 'Main body content of the notification',
      android: {
        channelId,
        smallIcon: 'name-of-a-small-icon', // optional, defaults to 'ic_launcher'.
        // pressAction is needed if you want the notification to open the app when pressed
        pressAction: {
          id: 'default',
        },
      },
    });
  }

  const handleStart = () => {
    console.log('Starting Pushed Service');
    startService('PushedService').then((newToken) => {
      console.log(`Service has started: ${newToken}`);
      setToken(newToken);
      setServiceStarted(true);
    });
  };

  const handleStop = () => {
    stopService().then((message) => {
      console.log(message);
      setToken('');
      setServiceStarted(false);
    });
  };

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(
      NativeModules.PushedReactNative
    );
    const eventListener = eventEmitter.addListener(
      PushedEventTypes.PUSH_RECEIVED,
      (push: Push) => {
        console.log(push);
        onDisplayNotification(push);
      }
    );

    // Removes the listener once unmounted
    return () => {
      eventListener.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      {serviceStarted ? (
        <>
          <Text style={styles.label}>Token:</Text>
          <TextInput
            style={styles.textInput}
            value={token}
            editable={false}
            selectTextOnFocus={true}
          />
        </>
      ) : (
        <Text style={styles.notListeningLabel}>Service is not listening</Text>
      )}
      <View style={styles.buttonRow}>
        <Button title="Start" onPress={handleStart} disabled={serviceStarted} />
        <Button title="Stop" onPress={handleStop} disabled={!serviceStarted} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  label: {
    marginBottom: 10,
    fontSize: 16,
  },
  textInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    width: '90%',
    textAlign: 'center',
  },
  notListeningLabel: {
    marginBottom: 20,
    fontSize: 16,
    color: 'red',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    width: '80%',
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
});
