import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Lock,
  Key,
  Copy,
  Check,
  CheckCheck,
  Shield,
  MessageSquare,
  Search,
  BookOpen,
  Trash2,
  MoreVertical,
  ExternalLink,
  ChevronLeft,
  AlertCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';
import api from '../../lib/api';
import { getChatSocket } from '../../lib/socket';
import { E2EEService } from '../../lib/e2ee';

export interface ChatContextPayload {
  bankType?: 'VOCABULARY' | 'EXAM';
  bankId?: string;
  bankTitle?: string;
  bankOwnerId?: string;
  languageSpaceId?: string;
}

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    id: string;
    displayName: string;
    avatar?: string;
  };
  initialTargetUser?: {
    id: string;
    displayName: string;
    avatar?: string;
  } | null;
  initialContext?: ChatContextPayload | null;
  onViewBank?: (bankType: 'VOCABULARY' | 'EXAM', bankId: string, languageSpaceId?: string) => void;
}

interface ConversationItem {
  id: string;
  contextType: string;
  bankType?: 'VOCABULARY' | 'EXAM';
  bankId?: string;
  bankTitle?: string;
  bankOwnerId?: string;
  languageSpaceId?: string;
  lastMessageText: string;
  lastMessageType: string;
  lastMessageAt: string;
  unreadCount: number;
  targetUser: {
    id: string;
    displayName: string;
    avatar?: string;
    email?: string;
  };
}

interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  messageType: 'TEXT' | 'ACCESS_KEY' | 'BANK_CONTEXT' | 'SYSTEM';
  ciphertext: string;
  encryptedKeys?: Record<string, string>;
  iv?: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  metadata?: any;
  isDeleted?: boolean;
  createdAt: string;
  sender?: {
    id: string;
    displayName: string;
    avatar?: string;
  };
  decryptedText?: string;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialTargetUser,
  initialContext,
  onViewBank,
}) => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loadingConv, setLoadingConv] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  // E2EE PIN States: 6 distinct boxes
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '']);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isSettingUpPin, setIsSettingUpPin] = useState(false);
  const [e2eeUnlocked, setE2eeUnlocked] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pinAttempts, setPinAttempts] = useState(() => {
    const saved = sessionStorage.getItem(`vf_pin_fails_${currentUser?.id}`);
    return saved ? Number(saved) : 0;
  });
  const [chatTtlDays, setChatTtlDays] = useState(10);

  // Load chat TTL config from admin settings
  useEffect(() => {
    api
      .get('/chat/config')
      .then((res: any) => {
        if (res?.data?.ttlDays) {
          setChatTtlDays(res.data.ttlDays);
        }
      })
      .catch(() => {});
  }, []);

  // Reset digits when PIN modal opens
  useEffect(() => {
    if (isPinModalOpen) {
      setPinDigits(['', '', '', '', '', '']);
      setPinError('');
      setTimeout(() => {
        pinInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isPinModalOpen]);

  // Inside Chat: Create Access Key for target user
  const [isCreatingKeyInChat, setIsCreatingKeyInChat] = useState(false);
  const [creatingKeyPassword, setCreatingKeyPassword] = useState('');
  const [createdKeyData, setCreatedKeyData] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Typing indicator
  const [otherUserTyping, setOtherUserTyping] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  // Check E2EE status on load
  useEffect(() => {
    if (currentUser?.id) {
      setE2eeUnlocked(E2EEService.isUnlocked(currentUser.id));
      checkUserE2eeSetup();
    }
  }, [currentUser?.id]);

  // Connect socket
  useEffect(() => {
    if (!currentUser?.id || !isOpen) return;

    const socket = getChatSocket(currentUser.id);
    socketRef.current = socket;

    socket.on('new_message', async (message: MessageItem) => {
      if (activeConversation && message.conversationId === activeConversation.id) {
        // Decrypt incoming message
        let decryptedText = message.ciphertext;
        if (message.messageType === 'TEXT' && message.iv && message.encryptedKeys) {
          decryptedText = await E2EEService.decryptMessage(
            currentUser.id,
            message.ciphertext,
            message.iv,
            message.encryptedKeys,
          );
        }
        setMessages((prev) => [...prev, { ...message, decryptedText }]);
        scrollToBottom();

        // Mark read
        socket.emit('mark_read', {
          conversationId: activeConversation.id,
          userId: currentUser.id,
          messageId: message.id,
        });
      } else {
        // Increment unread in conversation list
        loadConversations();
      }
    });

    socket.on('message_read', (data: any) => {
      if (activeConversation && data.conversationId === activeConversation.id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === currentUser.id ? { ...m, status: 'READ' } : m,
          ),
        );
      }
    });

    socket.on('user_typing', (data: any) => {
      if (activeConversation && data.userId !== currentUser.id) {
        setOtherUserTyping(data.isTyping ? data.displayName || 'Đối phương' : null);
      }
    });

    return () => {
      if (activeConversation) {
        socket.emit('leave_conversation', { conversationId: activeConversation.id });
      }
    };
  }, [currentUser?.id, isOpen, activeConversation?.id]);

  // Load conversations list
  const loadConversations = async () => {
    setLoadingConv(true);
    try {
      const res: any = await api.get('/chat/conversations');
      if (res?.data?.items) {
        setConversations(res.data.items);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConv(false);
    }
  };

  // Initial target user handling
  useEffect(() => {
    if (!isOpen) return;
    loadConversations();

    if (initialTargetUser) {
      openOrCreateTargetChat(initialTargetUser.id, initialContext);
    }
  }, [isOpen, initialTargetUser?.id]);

  const openOrCreateTargetChat = async (
    targetUserId: string,
    context?: ChatContextPayload | null,
  ) => {
    try {
      const res: any = await api.post('/chat/conversations', {
        targetUserId,
        contextType: context?.bankId ? 'BANK' : 'GENERAL',
        bankType: context?.bankType,
        bankId: context?.bankId,
        bankTitle: context?.bankTitle,
        bankOwnerId: context?.bankOwnerId,
        languageSpaceId: context?.languageSpaceId,
      });

      if (res?.data) {
        selectConversation(res.data);
      }
    } catch (err) {
      console.error('Failed to create/open conversation:', err);
    }
  };

  const selectConversation = async (conv: ConversationItem) => {
    if (activeConversation && socketRef.current) {
      socketRef.current.emit('leave_conversation', { conversationId: activeConversation.id });
    }

    setActiveConversation(conv);
    setCreatedKeyData(null);
    setIsCreatingKeyInChat(false);

    if (socketRef.current) {
      socketRef.current.emit('join_conversation', {
        conversationId: conv.id,
        userId: currentUser.id,
      });
    }

    // Load messages
    setLoadingMessages(true);
    try {
      const res: any = await api.get(`/chat/conversations/${conv.id}/messages`, {
        params: { limit: 50 },
      });

      if (res?.data?.items) {
        const rawMessages: MessageItem[] = res.data.items;
        // Decrypt text messages
        const decryptedList = await Promise.all(
          rawMessages.map(async (m) => {
            if (m.isDeleted) {
              return { ...m, decryptedText: 'Tin nhắn đã được thu hồi' };
            }
            if (m.messageType === 'TEXT' && m.iv && m.encryptedKeys) {
              const text = await E2EEService.decryptMessage(
                currentUser.id,
                m.ciphertext,
                m.iv,
                m.encryptedKeys,
              );
              return { ...m, decryptedText: text };
            }
            return { ...m, decryptedText: m.ciphertext };
          }),
        );
        setMessages(decryptedList);
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Check if current user has E2EE keys set up on server
  const checkUserE2eeSetup = async () => {
    try {
      const res: any = await api.get('/chat/keys/me');
      if (!res?.data?.encryptedPrivateKey) {
        // Needs initial setup
        setIsSettingUpPin(true);
        setIsPinModalOpen(true);
      } else {
        // Has keys, check if session already unlocked with saved PIN
        const sessionPin = sessionStorage.getItem(`vf_unlocked_pin_${currentUser.id}`);
        if (sessionPin && !E2EEService.isUnlocked(currentUser.id)) {
          const unlocked = await E2EEService.unlockPrivateKeyWithPin(
            currentUser.id,
            sessionPin,
            res.data.encryptedPrivateKey,
            res.data.keyDerivationSalt,
          );
          if (unlocked) {
            setE2eeUnlocked(true);
            return;
          }
        }

        if (!E2EEService.isUnlocked(currentUser.id)) {
          setIsSettingUpPin(false);
          setIsPinModalOpen(true);
        } else {
          setE2eeUnlocked(true);
        }
      }
    } catch (err) {
      console.error('Error checking E2EE keys:', err);
    }
  };

  const handlePinDigitChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, '');
    const newDigits = [...pinDigits];
    newDigits[index] = cleaned.slice(-1);
    setPinDigits(newDigits);
    setPinError('');

    // Auto-advance to next input box
    if (cleaned && index < 5) {
      pinInputRefs.current[index + 1]?.focus();
    }
  };

  const handlePinDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setPinDigits(newDigits);
    setPinError('');

    const nextIndex = Math.min(pasted.length, 5);
    pinInputRefs.current[nextIndex]?.focus();
  };

  // Handle PIN unlock or setup
  const handlePinSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const enteredPin = pinDigits.join('');
    if (enteredPin.length < 6) {
      setPinError('Vui lòng nhập đủ 6 chữ số mã PIN');
      return;
    }

    setPinError('');
    try {
      if (isSettingUpPin) {
        // Generate new keys and register on server
        const keyData = await E2EEService.setupUserKeys(currentUser.id, enteredPin);
        await api.post('/chat/keys', keyData);
        sessionStorage.setItem(`vf_unlocked_pin_${currentUser.id}`, enteredPin);
        sessionStorage.removeItem(`vf_pin_fails_${currentUser.id}`);
        setPinAttempts(0);
        setE2eeUnlocked(true);
        setIsPinModalOpen(false);
      } else {
        // Fetch encrypted key from server and unlock
        const res: any = await api.get('/chat/keys/me');
        if (res?.data) {
          const success = await E2EEService.unlockPrivateKeyWithPin(
            currentUser.id,
            enteredPin,
            res.data.encryptedPrivateKey,
            res.data.keyDerivationSalt,
          );
          if (success) {
            sessionStorage.setItem(`vf_unlocked_pin_${currentUser.id}`, enteredPin);
            sessionStorage.removeItem(`vf_pin_fails_${currentUser.id}`);
            setPinAttempts(0);
            setE2eeUnlocked(true);
            setIsPinModalOpen(false);
            // Re-decrypt messages if in active conversation
            if (activeConversation) {
              selectConversation(activeConversation);
            }
          } else {
            const nextAttempts = pinAttempts + 1;
            setPinAttempts(nextAttempts);
            sessionStorage.setItem(`vf_pin_fails_${currentUser.id}`, String(nextAttempts));

            if (nextAttempts >= 5) {
              // Exceeded 5 times: wipe old messages & keys from server, reset local state, force create new PIN
              try {
                await api.post('/chat/reset-e2ee');
              } catch (resetErr) {
                console.error('Failed to reset E2EE on server:', resetErr);
              }
              E2EEService.lockSession();
              sessionStorage.removeItem(`vf_unlocked_pin_${currentUser.id}`);
              sessionStorage.removeItem(`vf_pin_fails_${currentUser.id}`);
              setPinAttempts(0);
              setMessages([]);
              setIsSettingUpPin(true);
              setPinDigits(['', '', '', '', '', '']);
              pinInputRefs.current[0]?.focus();
              setPinError(
                'Bạn đã nhập sai mã PIN 5 lần! Toàn bộ lịch sử tin nhắn mã hóa cũ đã bị xóa sạch vĩnh viễn trên máy chủ để bảo mật. Vui lòng thiết lập mã PIN 6 số mới.',
              );
            } else {
              const remaining = 5 - nextAttempts;
              setPinDigits(['', '', '', '', '', '']);
              pinInputRefs.current[0]?.focus();
              setPinError(
                `Mã PIN không đúng! Bạn còn ${remaining} lần thử trước khi toàn bộ tin nhắn bị xóa sạch vĩnh viễn.`,
              );
            }
          }
        }
      }
    } catch (err: any) {
      setPinError(err?.message || 'Có lỗi xảy ra khi xác thực mã PIN');
    }
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeConversation || sending) return;

    setSending(true);
    try {
      const plaintext = inputMessage.trim();
      setInputMessage('');

      // Fetch recipient's public key
      const recipientKeyRes: any = await api.get(
        `/chat/keys/user/${activeConversation.targetUser.id}`,
      );
      const recipientPubKey = recipientKeyRes?.data?.publicKey;

      // Fetch sender's public key
      const senderKeyRes: any = await api.get(`/chat/keys/user/${currentUser.id}`);
      const senderPubKey = senderKeyRes?.data?.publicKey;

      let payload: any = {
        messageType: 'TEXT',
        ciphertext: plaintext,
      };

      // If both users have E2EE keys and sender is unlocked, encrypt!
      if (recipientPubKey && senderPubKey && E2EEService.isUnlocked(currentUser.id)) {
        const encrypted = await E2EEService.encryptMessage(
          plaintext,
          recipientPubKey,
          activeConversation.targetUser.id,
          senderPubKey,
          currentUser.id,
        );
        payload = {
          messageType: 'TEXT',
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          encryptedKeys: encrypted.encryptedKeys,
        };
      }

      // Send via websocket or REST fallback
      const res: any = await api.post(
        `/chat/conversations/${activeConversation.id}/messages`,
        payload,
      );

      if (res?.data) {
        setMessages((prev) => [...prev, { ...res.data, decryptedText: plaintext }]);
        scrollToBottom();
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };

  // Owner directly creates Access Key in chat for target user
  const handleCreateAccessKeyInChat = async () => {
    if (!activeConversation?.bankId) return;

    try {
      const res: any = await api.post('/community/access-keys', {
        bankType: activeConversation.bankType || 'VOCABULARY',
        bankId: activeConversation.bankId,
        targetUserId: activeConversation.targetUser.id,
        bankPassword: creatingKeyPassword || undefined,
        forceRegenerate: true,
      });

      if (res?.data?.accessKey) {
        setCreatedKeyData(res.data.accessKey);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể tạo Access Key');
    }
  };

  // Send created key as a special message
  const handleSendKeyToChat = async () => {
    if (!createdKeyData || !activeConversation) return;

    try {
      const res: any = await api.post(
        `/chat/conversations/${activeConversation.id}/messages`,
        {
          messageType: 'ACCESS_KEY',
          ciphertext: `Access Key: ${createdKeyData}`,
          metadata: {
            bankId: activeConversation.bankId,
            bankTitle: activeConversation.bankTitle,
            accessKey: createdKeyData,
          },
        },
      );

      if (res?.data) {
        setMessages((prev) => [
          ...prev,
          {
            ...res.data,
            decryptedText: `Access Key: ${createdKeyData}`,
          },
        ]);
        setCreatedKeyData(null);
        setIsCreatingKeyInChat(false);
        scrollToBottom();
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể gửi mã Access Key qua chat');
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId: string, mode: 'FOR_ME' | 'FOR_EVERYONE') => {
    try {
      await api.delete(`/chat/messages/${messageId}`, {
        params: { mode },
      });
      if (mode === 'FOR_ME') {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, isDeleted: true, decryptedText: 'Tin nhắn đã được thu hồi' }
              : m,
          ),
        );
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể xóa tin nhắn');
    }
  };

  if (!isOpen) return null;

  const isBankOwner =
    activeConversation?.bankOwnerId === currentUser.id && !!activeConversation?.bankId;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl h-full bg-slate-900 border-l border-slate-800 flex flex-col md:flex-row shadow-2xl overflow-hidden animate-slide-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Conversation List */}
        <div
          className={`w-full md:w-80 h-full border-r border-slate-800 bg-slate-950 flex flex-col ${
            activeConversation ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* List Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              <h2 className="font-bold text-white text-base">Tin nhắn học tập</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPinModalOpen(true)}
                title={e2eeUnlocked ? 'E2EE Đã mở khóa' : 'Mở khóa PIN E2EE'}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${
                  e2eeUnlocked
                    ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                    : 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="text-[10px]">{e2eeUnlocked ? 'E2EE' : 'Khóa PIN'}</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white md:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Conversations Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {loadingConv ? (
              <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                Đang tải tin nhắn...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Chưa có cuộc trò chuyện nào. Bạn có thể nhắn tin cho chủ kho từ trang cộng đồng.
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = activeConversation?.id === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`p-3.5 cursor-pointer transition flex items-center gap-3 ${
                      isSelected
                        ? 'bg-indigo-600/15 border-l-2 border-indigo-500'
                        : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-indigo-300 flex-shrink-0">
                      {conv.targetUser?.displayName?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-white truncate">
                          {conv.targetUser?.displayName}
                        </h4>
                        {conv.unreadCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-indigo-500 text-white text-[10px] font-bold">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      {conv.bankTitle && (
                        <div className="text-[10px] text-indigo-400 truncate flex items-center gap-1 mt-0.5">
                          <BookOpen className="w-3 h-3 flex-shrink-0" />
                          {conv.bankTitle}
                        </div>
                      )}
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {conv.lastMessageText || 'Bắt đầu cuộc trò chuyện'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Chat Conversation */}
        <div
          className={`flex-1 h-full flex flex-col bg-slate-900 ${
            !activeConversation ? 'hidden md:flex items-center justify-center' : 'flex'
          }`}
        >
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveConversation(null)}
                    className="p-1 text-slate-400 hover:text-white md:hidden"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">
                    {activeConversation.targetUser?.displayName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      {activeConversation.targetUser?.displayName}
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-normal">
                        Học viên
                      </span>
                    </h3>
                    <div className="text-[10px] text-slate-400">
                      {otherUserTyping ? (
                        <span className="text-indigo-400 italic">đang nhập tin nhắn...</span>
                      ) : (
                        activeConversation.targetUser?.email
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Bank Owner Direct Action: Create Access Key */}
                  {isBankOwner && (
                    <button
                      onClick={() => setIsCreatingKeyInChat(!isCreatingKeyInChat)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-medium flex items-center gap-1.5 transition"
                    >
                      <Key className="w-3.5 h-3.5" />
                      Cấp Access Key
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Context Banner: Discussing a Bank */}
              {activeConversation.bankTitle && (
                <div className="px-4 py-2.5 bg-indigo-950/40 border-b border-indigo-900/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-indigo-300 truncate">
                    <BookOpen className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span className="text-slate-400">Đang trao đổi về:</span>
                    <strong className="text-white truncate">
                      {activeConversation.bankTitle}
                    </strong>
                  </div>
                  {onViewBank && activeConversation.bankId && (
                    <button
                      onClick={() =>
                        onViewBank(
                          activeConversation.bankType || 'VOCABULARY',
                          activeConversation.bankId!,
                          activeConversation.languageSpaceId,
                        )
                      }
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 flex-shrink-0"
                    >
                      Xem kho
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Quick Create Access Key Box in Chat */}
              {isCreatingKeyInChat && (
                <div className="p-4 bg-slate-950 border-b border-amber-500/30 space-y-3 animate-slide-down">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
                    <div className="flex items-center gap-1.5">
                      <Key className="w-4 h-4" />
                      Cấp mã truy cập cho {activeConversation.targetUser?.displayName}
                    </div>
                    <button
                      onClick={() => setIsCreatingKeyInChat(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      Đóng
                    </button>
                  </div>

                  {!createdKeyData ? (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-300">
                        Hệ thống sẽ tự động tạo một Access Key riêng biệt, liên kết giữa tài khoản học viên và kho <strong>{activeConversation.bankTitle}</strong>.
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="password"
                          placeholder="Mật khẩu kho (nếu có yêu cầu)..."
                          value={creatingKeyPassword}
                          onChange={(e) => setCreatingKeyPassword(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500"
                        />
                        <button
                          type="button"
                          onClick={handleCreateAccessKeyInChat}
                          className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition"
                        >
                          Tạo mã ngay
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                      <div className="text-xs font-medium text-emerald-400">
                        Mã đã tạo: <span className="font-mono">{createdKeyData}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(createdKeyData);
                            setCopiedKey(true);
                            setTimeout(() => setCopiedKey(false), 2000);
                          }}
                          className="px-3 py-1.5 rounded bg-slate-800 text-xs text-slate-300 flex items-center gap-1"
                        >
                          {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                          {copiedKey ? 'Đã copy' : 'Sao chép'}
                        </button>
                        <button
                          type="button"
                          onClick={handleSendKeyToChat}
                          className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-medium flex items-center gap-1"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Gửi mã vào cuộc trò chuyện
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Chat Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500 gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                    Đang tải lịch sử trò chuyện...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-semibold text-white">
                      Mã hóa đầu cuối E2EE
                    </h4>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Cuộc trò chuyện giữa bạn và học viên được mã hóa an toàn. Máy chủ không thể đọc được nội dung tin nhắn. Tin nhắn tự động xóa sau 10 ngày.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === currentUser.id;

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                      >
                        <div
                          className={`relative max-w-[85%] md:max-w-[70%] p-3.5 rounded-2xl text-xs ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-tr-xs'
                              : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-tl-xs'
                          }`}
                        >
                          {/* Special Message Type: ACCESS_KEY */}
                          {m.messageType === 'ACCESS_KEY' ? (
                            <div className="space-y-2 p-1">
                              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                                <Key className="w-4 h-4" />
                                🔐 Thẻ Quyền Truy Cập (Access Key)
                              </div>
                              <p className="text-slate-300">
                                Bạn đã được cấp quyền truy cập vào kho:
                              </p>
                              <div className="font-semibold text-white flex items-center gap-1">
                                📚 {m.metadata?.bankTitle || 'Kho học tập'}
                              </div>
                              <div className="p-2 rounded bg-black/40 border border-amber-500/30 font-mono text-amber-300 text-center select-all break-all">
                                {m.metadata?.accessKey || m.decryptedText}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    m.metadata?.accessKey || m.decryptedText || '',
                                  );
                                  alert('Đã sao chép mã Access Key!');
                                }}
                                className="w-full py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center gap-1 transition"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                Sao chép Access Key
                              </button>
                            </div>
                          ) : (
                            /* Standard Text Message */
                            <p className="leading-relaxed whitespace-pre-wrap break-words">
                              {m.decryptedText || m.ciphertext}
                            </p>
                          )}

                          {/* Message Footer */}
                          <div
                            className={`flex items-center justify-end gap-1 text-[9px] mt-1 ${
                              isMe ? 'text-indigo-200' : 'text-slate-400'
                            }`}
                          >
                            <span>
                              {new Date(m.createdAt).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isMe && (
                              <span title={m.status === 'READ' ? 'Đã xem' : 'Đã gửi'}>
                                {m.status === 'READ' ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Hover Action Menu */}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 text-[10px] text-slate-500 mt-1 transition">
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(m.id, 'FOR_ME')}
                            className="hover:text-red-400"
                          >
                            Xóa cho tôi
                          </button>
                          {isMe && !m.isDeleted && (
                            <>
                              <span>•</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(m.id, 'FOR_EVERYONE')}
                                className="hover:text-red-400"
                              >
                                Thu hồi
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-slate-800 bg-slate-950/80 backdrop-blur flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Nhập tin nhắn (được bảo vệ bằng mã hóa E2EE)..."
                  className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || sending}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Gửi
                </button>
              </form>
            </>
          ) : (
            <div className="text-center p-8 text-xs text-slate-500">
              Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu.
            </div>
          )}
        </div>
      </div>

      {/* E2EE PIN Modal */}
      {isPinModalOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setIsPinModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {isSettingUpPin ? 'Thiết lập mã PIN E2EE' : 'Mở khóa tin nhắn E2EE'}
                </h3>
                <p className="text-xs text-slate-400">Mã hóa đầu cuối không qua máy chủ</p>
              </div>
            </div>

            {/* TTL Security Policy Notice */}
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-indigo-200">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>Bảo mật tin nhắn E2EE</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                Tin nhắn được mã hóa đầu cuối thiết bị. Theo chính sách hệ thống, toàn bộ tin nhắn sẽ tự động bị xóa vĩnh viễn sau{' '}
                <span className="text-white font-bold underline">{chatTtlDays} ngày</span>.
              </p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {isSettingUpPin
                ? 'Nhập mã PIN 6 số để tạo cặp khóa riêng tư. Khóa sẽ được mã hóa bằng AES-GCM với mã PIN của bạn.'
                : 'Nhập mã PIN 6 số bạn đã thiết lập để giải mã và đọc tin nhắn trong phiên làm việc này.'}
            </p>

            {pinAttempts > 0 && !isSettingUpPin && (
              <div className="text-[11px] text-amber-400 font-bold text-center bg-amber-500/10 border border-amber-500/20 py-1.5 px-3 rounded-lg">
                Đã nhập sai: {pinAttempts}/5 lần (Còn {5 - pinAttempts} lần thử)
              </div>
            )}

            {pinError && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <form onSubmit={handlePinSubmit} className="space-y-5">
              {/* 6 Separate OTP Digit Input Boxes */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                {pinDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (pinInputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handlePinDigitKeyDown(index, e)}
                    onPaste={handlePinPaste}
                    style={{
                      WebkitTextSecurity: 'disc',
                      MozAppearance: 'textfield',
                    } as React.CSSProperties}
                    className="w-11 h-14 sm:w-12 sm:h-14 shrink-0 rounded-2xl text-center text-2xl font-mono font-bold bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition shadow-inner select-none"
                    autoComplete="off"
                  />
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition cursor-pointer"
                >
                  Bỏ qua
                </button>
                <button
                  type="submit"
                  disabled={pinDigits.join('').length < 6}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white transition shadow-lg shadow-indigo-500/20 cursor-pointer"
                >
                  {isSettingUpPin ? 'Tạo khóa bảo vệ' : 'Mở khóa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
