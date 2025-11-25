import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Determine API URL based on platform
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    // Web version - use same host as current page
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000/api';
    }
    // For Replit, use the full URL with proper origin
    const protocol = window.location.protocol;
    return `${protocol}//${window.location.hostname}:3000/api`;
  }
  // Mobile version
  return process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
};

const API_BASE_URL = getApiUrl();

interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
}

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor(config: ApiClientConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  // Auth
  async register(email: string, username: string, password: string, inviteCode: string) {
    const response = await this.client.post('/auth/register', { email, username, password, inviteCode });
    const { token, user } = response.data;
    await AsyncStorage.setItem('authToken', token);
    this.token = token;
    return { token, user };
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    const { token, user } = response.data;
    await AsyncStorage.setItem('authToken', token);
    this.token = token;
    return { token, user };
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Chats
  async getChats() {
    const response = await this.client.get('/chats');
    return response.data;
  }

  async createPrivateChat(otherUserId: number) {
    const response = await this.client.post('/chats/private', { otherUserId });
    return response.data;
  }

  async createGroupChat(title: string, description: string, participantIds: number[]) {
    const response = await this.client.post('/chats/group', { title, description, participantIds });
    return response.data;
  }

  // Messages
  async getMessages(chatId: string | number) {
    const response = await this.client.get(`/messages/${chatId}`);
    return response.data;
  }

  async sendMessage(chatId: string | number, text?: string, imageUri?: string) {
    const response = await this.client.post(`/messages/${chatId}`, {
      text,
      imageUri,
      type: imageUri ? 'image' : 'text',
    });
    return response.data;
  }

  async editMessage(messageId: number, text: string) {
    const response = await this.client.put(`/messages/${messageId}`, { text });
    return response.data;
  }

  async deleteMessage(messageId: number) {
    const response = await this.client.delete(`/messages/${messageId}`);
    return response.data;
  }

  // Users
  async getAllUsers() {
    const response = await this.client.get('/users');
    return response.data;
  }

  async searchUsers(username: string) {
    const response = await this.client.get(`/users/search/${username}`);
    return response.data;
  }

  async logout() {
    await AsyncStorage.removeItem('authToken');
    this.token = null;
  }
}

export const apiClient = new ApiClient({ baseURL: API_BASE_URL });
