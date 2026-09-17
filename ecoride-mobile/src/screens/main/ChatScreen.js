import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { chatApi } from '../../api/chatApi';
import { createTripSocket } from '../../api/trackingApi';
import Button from '../../components/Button';
import Field from '../../components/Field';
import Screen from '../../components/Screen';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../utils/theme';
import { formatDateTime, getErrorMessage } from '../../utils/format';

export default function ChatScreen({ route }) {
  const { tripId } = route.params || {};
  const { token, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    let liveSocket;
    async function boot() {
      try {
        setMessages(await chatApi.history(tripId));
        liveSocket = createTripSocket(token);
        liveSocket.emit('join-trip', tripId);
        liveSocket.on('receive-message', (payload) => {
          setMessages((current) => [...current, payload]);
        });
        setSocket(liveSocket);
      } catch (error) {
        Alert.alert('Chat unavailable', getErrorMessage(error));
      }
    }
    if (tripId && token) boot();
    return () => {
      liveSocket?.disconnect();
    };
  }, [tripId, token]);

  function send() {
    if (!message.trim() || !socket) return;
    socket.emit('send-message', { tripId, message: { senderEmail: user?.email, content: message.trim() } });
    setMessages((current) => [...current, {
      id: `local-${Date.now()}`,
      senderEmail: user?.email,
      content: message.trim(),
      timestamp: new Date().toISOString(),
    }]);
    setMessage('');
  }

  return (
    <Screen scroll={false} contentStyle={styles.content}>
      <FlatList
        data={messages}
        keyExtractor={(item, index) => item.id || `${index}`}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.senderEmail === user?.email && styles.mine]}>
            <Text style={styles.sender}>{item.senderEmail}</Text>
            <Text style={styles.text}>{item.content}</Text>
            <Text style={styles.time}>{formatDateTime(item.timestamp)}</Text>
          </View>
        )}
      />
      <View style={styles.composer}>
        <Field value={message} onChangeText={setMessage} placeholder="Message" style={styles.input} />
        <Button title="Send" onPress={send} style={styles.send} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 12,
  },
  list: {
    gap: 10,
    paddingBottom: 12,
  },
  bubble: {
    maxWidth: '86%',
    alignSelf: 'flex-start',
    borderRadius: 8,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    gap: 4,
  },
  mine: {
    alignSelf: 'flex-end',
    backgroundColor: colors.blue,
    borderColor: colors.blue,
  },
  sender: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  text: {
    color: colors.text,
    lineHeight: 20,
  },
  time: {
    color: '#CBD5E1',
    fontSize: 11,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  input: {
    flex: 1,
  },
  send: {
    width: 84,
  },
});
