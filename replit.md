# Overview

Romax Call is a cross-platform mobile messaging application built with React Native and Expo. The app provides real-time messaging capabilities with support for private chats, group conversations, and audio/video calling features. It follows a minimalistic light design philosophy with a clean, user-friendly interface.

## Recent Changes (Session: Bug Fixes & Type Safety)

- **Fixed critical type safety issues:**
  - Added missing `unreadCount: 0` property in ChatContext when creating private and group chats (lines 290, 321)
  - Added `localStream` and `remoteStream` to CallContext Provider value (lines 361-362)
  - Enhanced CallSession type interface with `callerName` and `recipientName` properties and 'rejected' status

- **Fixed API client and authentication bugs:**
  - Updated `apiClient.register()` to accept and send `inviteCode` parameter to backend
  - Fixed AuthContext `register()` call to pass `inviteCode` to API client

- **Fixed SearchScreen async handling:**
  - Converted `handleMessagePress()` to async function with proper await for `createPrivateChat()`
  - Added error handling and try-catch block
  - Added type annotation for User parameter in filter callback
  - Created and exported `DEMO_USERS` constant from ChatContext for user search functionality

- **Compilation Status:** ✅ Zero LSP errors, 1342 modules bundled successfully

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework & Platform**
- Built on React Native with Expo managed workflow (SDK 54)
- Supports iOS, Android, and Web platforms
- Uses TypeScript for type safety
- Implements React Navigation for routing with native stack and bottom tab navigators

**State Management**
- Context API for global state (AuthContext, ChatContext)
- Local state management with React hooks
- AsyncStorage for persistent client-side data storage

**UI/UX Architecture**
- Component-based architecture with reusable themed components
- Minimalistic light theme with defined color palette (#FFFFFF, #F5F5F5, #4B61FF accent)
- Gesture-based interactions using react-native-gesture-handler
- Keyboard-aware layouts with react-native-keyboard-controller
- Animated interactions using react-native-reanimated

**Navigation Structure**
- Root Navigator: Handles authentication flow vs main app flow
- Auth Stack: Login and Register screens
- Main Tabs: Three-tab navigation (Chats, Search, Settings)
- Modal screens for calls, rooms, and group management

**Key Features**
- Authentication system with email, password, username, and invite code validation
- Real-time chat with text and image messages
- Message editing and deletion capabilities (long-press menu on own messages)
- In-chat message search functionality with real-time results
- Image sharing via device gallery with expo-image-picker
- Group chat creation and management (up to 30 participants)
- User search and discovery
- Audio/video calling interfaces (UI implemented, WebRTC integration pending)
- Multi-user room support for group calls (up to 10 participants)
- Local push notifications for incoming messages via expo-notifications
- Haptic feedback on message interactions

## External Dependencies

**React Native & Expo Ecosystem**
- `expo` (v54) - Core Expo framework
- `react-native` (v0.81) - React Native framework
- `react` (v19.1) - React library
- `@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack` - Navigation solution
- `react-native-screens`, `react-native-safe-area-context` - Navigation dependencies

**UI & Interaction Libraries**
- `react-native-gesture-handler` - Gesture system
- `react-native-reanimated` - Animation library
- `react-native-keyboard-controller` - Keyboard management
- `expo-blur` - Blur effects for iOS tab bar
- `expo-haptics` - Haptic feedback
- `@expo/vector-icons` - Icon library (Feather icons used throughout)

**Media & Assets**
- `expo-image` - Optimized image component
- `expo-image-picker` - Image selection from device
- `expo-symbols` - SF Symbols support

**Storage & Persistence**
- `@react-native-async-storage/async-storage` - Local key-value storage for authentication tokens, user data, chats, and messages

**Notifications**
- `expo-notifications` - Push notification handling

**Platform Integration**
- `expo-linking` - Deep linking support
- `expo-web-browser` - In-app browser
- `expo-constants` - App constants and configuration
- `expo-status-bar` - Status bar management
- `expo-system-ui` - System UI configuration
- `expo-splash-screen` - Splash screen management

**Development Tools**
- `typescript` - Type checking
- `eslint` - Code linting
- `prettier` - Code formatting
- `babel-plugin-module-resolver` - Path aliasing (@/ imports)

**Backend Integration (Completed)**

## Database (PostgreSQL)
- **Status:** ✅ Схема создана и работает
- **Port:** 5432 (PostgreSQL)
- **Tables:**
  - users: id, email, username, password_hash, is_online, last_seen, created_at
  - chats: id, type (private/group), title, description, creator_id, created_at, updated_at
  - chat_participants: id, chat_id, user_id, joined_at, UNIQUE(chat_id, user_id)
  - messages: id, chat_id, sender_id, text, image_uri, type, is_read, is_deleted, edited_at, created_at
- **Indexes:** Для оптимизации: chat_id, sender_id, user_id

## API Backend (Completed)
- **Status:** ✅ Express.js сервер запущен на порту 3000
- **Endpoints:**
  - Auth: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me
  - Chats: GET /api/chats, POST /api/chats/private, POST /api/chats/group
  - Messages: GET /api/messages/:chatId, POST /api/messages/:chatId, PUT /api/messages/:messageId, DELETE /api/messages/:messageId
  - Users: GET /api/users, GET /api/users/search/:username

## Real-time (Socket.io)
- **Status:** ✅ Реал-тайм сообщения работают
- **Events:**
  - user:online - уведомление об онлайн статусе
  - message:send/received - отправка/получение сообщений в реал-тайм
  - chat:join/leave - присоединение/отключение от чата
  - users:active - список активных пользователей

## Frontend-Backend Integration
- **Status:** ✅ Подключено через API клиент
- **Auth:** JWT токены через Authorization заголовок
- **Storage:** Данные сохраняются в PostgreSQL
- **Real-time:** Socket.io клиент подключен к серверу
- **Environment:** REACT_APP_API_URL, REACT_APP_SOCKET_URL

**WebRTC Call Signaling & Media Streaming (Completed)**
- Socket.io based signaling infrastructure for audio/video calls
- Call state management through CallContext
- Call events: initiate, accept, reject, end, signal (for offer/answer/ICE)
- Both AudioCallScreen and VideoCallScreen integrated with call signaling
- RTCPeerConnection creation with proper offer/answer flow
- Local media stream acquisition (audio/video)
- Remote stream reception and display
- Audio/video track control (mute/unmute, camera on/off)
- HTML5 audio/video element integration for web platform
- Full call lifecycle: initiate → accept/reject → connected → end

**Call Interface UI (Completed - Prompt 8)**
- AudioCallScreen: Mute button, end call (red), speaker control
- VideoCallScreen: Camera switch, video toggle, mute, end call (red)
- Incoming calls: Accept/Reject buttons with haptic feedback
- Outgoing calls: End call button during ringing
- All buttons with haptic feedback and visual feedback (color/opacity changes)
- Dark theme with accent color for active states
- Call duration timer during connected state

**Authentication Flow**
- Invite code validation (currently hardcoded: WELCOME2024, SECURECHAT, INVITE123)
- User credentials stored locally with AsyncStorage
- Token-based session management with JWT

**Data Models**
- User: id, email, username, online status, timestamps
- Chat: private/group type, participants, messages, unread count
- Message: text/image/system types, read status, edit/delete support
- Group: title, description, participants, creator
- CallSession: audio/video type, participants, status tracking
- RoomParticipant: multi-user call participant state