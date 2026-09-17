import React, { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { chatApi } from '../../api/chatApi';
import { createTripSocket } from '../../api/trackingApi';
import Button from '../../components/Button';
import Field from '../../components/Field';
import Screen from '../../components/Screen';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../utils/theme';
import { formatDateTime } from '../../utils/format';

export default function ChatScreen({ route }) {
  const { tripId } = route.params || {};
  const { token, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const socketRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    let liveSocket;

    async function boot() {
      try {
        const history = await chatApi.history(tripId);
        setMessages(history);

        liveSocket = createTripSocket(token, tripId, (payload) => {
          setMessages((current) => [...current, payload]);
        });

        liveSocket.on('receive-message', (payload) => {
          setMessages((current) => [...current, payload]);
        });

        liveSocket.emit('join-trip', tripId);
        socketRef.current = liveSocket;
      } catch {
        // Chat history unavailable — non-fatal in mock mode
      }
    }

    if (tripId) boot();

    return () => {
      liveSocket?.disconnect();
    };
  }, [tripId, token]);

  function send() {
    const trimmed = message.trim();
    if (!trimmed) return;

    const outgoing = {
      id: `local-${Date.now()}`,
      senderEmail: user?.email,
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((current) => [...current, outgoing]);
    setMessage('');

    if (socketRef.current) {
      socketRef.current.emit('send-message', {
        tripId,
        message: { senderEmail: user?.email, content: trimmed },
      });
    }

    // Scroll to bottom
    setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 100);
  }

  return (
    <Screen scroll={false} contentStyle={styles.content}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item, index) => item.id || `${index}`}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd?.({ animated: false })}
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
