import { api } from '../config/api';

export interface WorkMessage {
  id: number;
  hiring_id: number;
  sender_id: number;
  receiver_id: number;
  sender_type: 'employer' | 'talent';
  content: string;
  is_read: boolean;
  created_at: string;
  sender_name: string;
  sender_image?: string;
}

export interface WorkConversation {
  other_user_id: number;
  name: string;
  profile_image?: string;
  hiring_id: number;
  job_title: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
}

export interface SendWorkMessageRequest {
  receiver_id: number;
  content: string;
  hiring_id: number;
}

export const workMessagesApi = {
  // Get all work conversations
  getWorkConversations: async (): Promise<{ conversations: WorkConversation[] }> => {
    const response = await api.get('/work-messages/conversations');
    return response.data;
  },

  // Get messages for a specific hiring
  getWorkMessages: async (hiringId: number): Promise<{ messages: WorkMessage[] }> => {
    const response = await api.get(`/work-messages/${hiringId}`);
    return response.data;
  },

  // Send a work message
  sendWorkMessage: async (data: SendWorkMessageRequest) => {
    const response = await api.post('/work-messages/send', data);
    return response.data;
  },

  // Mark messages as read
  markWorkMessagesRead: async (hiringId: number) => {
    const response = await api.patch(`/work-messages/${hiringId}/read`);
    return response.data;
  },

  // Get unread work message count
  getWorkUnreadCount: async (): Promise<{ unread_count: number }> => {
    const response = await api.get('/work-messages/unread-count');
    return response.data;
  }
};