import React, { useState, useEffect, useRef } from 'react';
import { workMessagesApi, type WorkConversation, type WorkMessage } from '../../api/workMessages';
import { Send, ArrowLeft, Briefcase } from 'lucide-react';

interface WorkMessagingProps {
  userRole: 'employer' | 'talent';
}

export const WorkMessaging: React.FC<WorkMessagingProps> = ({ userRole }) => {
  const [conversations, setConversations] = useState<WorkConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<WorkConversation | null>(null);
  const [messages, setMessages] = useState<WorkMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.hiring_id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const data = await workMessagesApi.getWorkConversations();
      setConversations(data.conversations);
    } catch (error) {
      console.error('Failed to load work conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (hiringId: number) => {
    try {
      const data = await workMessagesApi.getWorkMessages(hiringId);
      setMessages(data.messages);
      
      // Mark messages as read
      await workMessagesApi.markWorkMessagesRead(hiringId);
      
      // Update conversation unread count
      setConversations(prev => 
        prev.map(conv => 
          conv.hiring_id === hiringId 
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      const messageData = {
        receiver_id: selectedConversation.other_user_id,
        content: newMessage.trim(),
        hiring_id: selectedConversation.hiring_id
      };

      const response = await workMessagesApi.sendWorkMessage(messageData);
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      
      // Update conversation with new message
      setConversations(prev =>
        prev.map(conv =>
          conv.hiring_id === selectedConversation.hiring_id
            ? {
                ...conv,
                last_message: newMessage.trim(),
                last_message_at: new Date().toISOString()
              }
            : conv
        )
      );
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border h-[600px] flex">
      {/* Conversations List */}
      <div className={`${selectedConversation ? 'hidden md:block' : 'block'} w-full md:w-1/3 border-r`}>
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Work Messages
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {userRole === 'employer' ? 'Messages with hired talents' : 'Messages with employers'}
          </p>
        </div>
        
        <div className="overflow-y-auto h-[calc(600px-80px)]">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Briefcase className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No work conversations yet</p>
              <p className="text-sm mt-1">
                {userRole === 'employer' 
                  ? 'Hire talents to start messaging' 
                  : 'Get hired to start messaging with employers'
                }
              </p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.hiring_id}
                onClick={() => setSelectedConversation(conversation)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation?.hiring_id === conversation.hiring_id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    {conversation.profile_image ? (
                      <img 
                        src={conversation.profile_image} 
                        alt={conversation.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 font-medium">
                        {conversation.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 truncate">{conversation.name}</h4>
                      {conversation.unread_count > 0 && (
                        <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-blue-600 truncate">{conversation.job_title}</p>
                    {conversation.last_message && (
                      <p className="text-sm text-gray-500 truncate mt-1">{conversation.last_message}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Messages Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b bg-gray-50 flex items-center gap-3">
            <button
              onClick={() => setSelectedConversation(null)}
              className="md:hidden p-1 hover:bg-gray-200 rounded"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              {selectedConversation.profile_image ? (
                <img 
                  src={selectedConversation.profile_image} 
                  alt={selectedConversation.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-600 text-sm font-medium">
                  {selectedConversation.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{selectedConversation.name}</h4>
              <p className="text-sm text-blue-600">{selectedConversation.job_title}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => {
              const isOwn = message.sender_type === userRole;
              return (
                <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwn 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      isOwn ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={sending}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-gray-500">
          <div className="text-center">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Select a conversation to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
};