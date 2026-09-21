import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatApi } from '../../api/chatApi';
import { createTripSocket } from '../../api/trackingApi';
import Screen from '../../components/Screen';
import Badge from '../../components/Badge';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing } from '../../utils/theme';
import { formatDateTime } from '../../utils/format';

export default function ChatScreen({ route, navigation }) {
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
        setMessages(history || []);

        liveSocket = createTripSocket(token, tripId, (payload) => {
          setMessages((current) => [...current, payload]);
        });

        liveSocket.on('receive-message', (payload) => {
          setMessages((current) => [...current, payload]);
        });

        liveSocket.emit('join-trip', tripId);
        socketRef.current = liveSocket;
      } catch {
        // Chat history unavailable
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

    setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 100);
  }

  return (
    <Screen scroll={false} contentStyle={styles.content}>
      {/* ── Sub-header banner ── */}
      <View style={styles.chatHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.chatTitle}>Trip Discussion</Text>
          <Text style={styles.chatSubtitle}>Trip Reference #{tripId || 'N/A'}</Text>
        </View>
        <Badge label="Active Session" variant="green" icon="radio-outline" size="sm" />
      </View>

      {/* ── Message Bubble List ── */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item, index) => item.id || `${index}`}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => listRef.current?.scrollToEnd?.({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="chatbubbles-outline" size={36} color={colors.muted} />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySub}>
              Coordinate pickup details, timing, or landmarks with your carpool partner.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isMine = item.senderEmail === user?.email;
          return (
            <View style={[styles.bubbleWrap, isMine ? styles.bubbleWrapMine : styles.bubbleWrapTheir]}>
              {!isMine ? (
                <Text style={styles.senderEmail}>{item.senderEmail}</Text>
              ) : null}
              <View style={[styles.bubble, isMine ? styles.mine : styles.theirs]}>
                <Text style={[styles.text, isMine && styles.mineText]}>
                  {item.content}
                </Text>
                <Text style={[styles.time, isMine && styles.mineTime]}>
                  {formatDateTime(item.timestamp)}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {/* ── Message Composer ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.composer}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor={colors.subtle}
            style={styles.composerInput}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
            onPress={send}
            disabled={!message.trim()}
          >
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 10,
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.panel,
    padding: 12,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 8,
  },
  chatTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  chatSubtitle: {
    fontSize: 11,
    color: colors.muted,
  },
  list: {
    gap: 12,
    paddingVertical: 10,
    flexGrow: 1,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  emptySub: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    maxWidth: 260,
  },
  bubbleWrap: {
    maxWidth: '82%',
  },
  bubbleWrapMine: {
    alignSelf: 'flex-end',
  },
  bubbleWrapTheir: {
    alignSelf: 'flex-start',
  },
  senderEmail: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '600',
    marginBottom: 3,
    marginLeft: 4,
  },
  bubble: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  mine: {
    backgroundColor: colors.green,
    borderBottomRightRadius: 2,
  },
  theirs: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderBottomLeftRadius: 2,
  },
  text: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  mineText: {
    color: '#FFFFFF',
  },
  time: {
    color: colors.muted,
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  mineTime: {
    color: '#D1FAE5',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: spacing.radius,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  composerInput: {
    flex: 1,
    minHeight: 38,
    maxHeight: 100,
    color: colors.text,
    fontSize: 14,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.subtle,
    opacity: 0.5,
  },
});
