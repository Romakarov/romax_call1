# Design Guidelines - Secure Messenger App

## Design Philosophy
Minimalistic modern light theme with clean, simple interface. No complex gradients, no heavy shadows, no flashy elements. Focus on clarity and usability.

## Architecture Decisions

### Authentication
**Auth Required** - Full authentication system with:
- Email + Password + Username + Invite Code registration
- Login with email/password
- JWT-based authentication with token refresh
- Invite codes validated server-side
- Account screen includes:
  - Logout (with confirmation)
  - User profile (avatar, username)
  - Settings access

### Navigation
**Tab Navigation** (3 tabs):
- **Чаты** (Chats) - Main messaging interface
- **Поиск** (Search) - User search
- **Настройки** (Settings) - App settings and profile

Modals for:
- Call screens (audio/video)
- Room screens (group calls)
- Group creation/settings

## Color Palette

### Primary Colors
- `#FFFFFF` - Primary background
- `#F5F5F5` - Secondary background
- `#EDEDED` - Tertiary background / dividers
- `#DADADA` - Borders / inactive elements
- `#A8A8A8` - Secondary text / placeholders
- `#1A1A1A` - Primary text
- `#4B61FF` - Accent color (buttons, own messages, active states)

### Usage Guidelines
- Background: White (#FFFFFF)
- Cards/Bubbles: Light gray (#F5F5F5)
- Own message bubbles: Accent color (#4B61FF) with white text
- Received messages: Light gray (#EDEDED) with dark text
- Input fields: White background with light gray (#DADADA) border

## Typography
- Use system default fonts (San Francisco on iOS, Roboto on Android)
- Clean, simple typography
- Text hierarchy:
  - Primary text: #1A1A1A
  - Secondary text: #A8A8A8
  - Timestamps: Small, #A8A8A8

## Screen Specifications

### 1. Authentication Screens (Register/Login)
**Layout:**
- Light background (#FFFFFF)
- Centered form layout
- Header: Custom, transparent
- Scrollable form area
- Submit button at bottom of form

**Components:**
- Input fields with rounded corners (border-radius: 8px)
- Border color: #DADADA
- Labels above inputs
- Fields: Email, Password, Username, Invite Code (register only)
- Primary button: Accent color (#4B61FF) with white text
- Link to switch between Register/Login

**Safe Area:**
- Top: insets.top + 24px
- Bottom: insets.bottom + 24px

### 2. Chats List Screen
**Layout:**
- Header: Transparent with title "Чаты"
- Scrollable list of conversations
- Tab bar at bottom

**Components:**
- Chat list items:
  - Avatar placeholder (circle, #EDEDED background)
  - Username (#1A1A1A, bold)
  - Last message preview (#A8A8A8)
  - Timestamp (#A8A8A8, small)
  - Online indicator (small green dot when online)
  - Unread badge (accent color #4B61FF)
- Pull to refresh
- Empty state: Simple text center-aligned

**Safe Area:**
- Top: headerHeight + 16px
- Bottom: tabBarHeight + 16px

### 3. Private/Group Chat Screen
**Layout:**
- Header: Default navigation with back button, chat name/group title
- Main area: Scrollable message list (inverted)
- Input bar: Fixed at bottom

**Components:**
- Message bubbles:
  - Own messages: Accent color (#4B61FF), white text, align right
  - Received messages: Light gray (#F5F5F5), dark text, align left
  - Border radius: 16px
  - Max width: 70% of screen
  - Timestamp below bubble (#A8A8A8, 11px)
- Read receipts: Small checkmark icons
- Input bar:
  - White background
  - Border top: 1px #EDEDED
  - Text input with rounded container
  - Send button (accent color icon)
- Typing indicator: "..." animated dots

**Safe Area:**
- Top: 8px (below navigation header)
- Bottom: insets.bottom + 8px (above input bar)

### 4. Search Screen
**Layout:**
- Header: Transparent with search bar
- Scrollable results list

**Components:**
- Search bar:
  - White background
  - Border: 1px #DADADA
  - Border radius: 8px
  - Placeholder: "Поиск по username (@nickname)"
- Search results:
  - Avatar placeholder (circle)
  - Username (#1A1A1A)
  - "Написать сообщение" button (accent color #4B61FF)
- Empty state: "Пользователи не найдены"

**Safe Area:**
- Top: headerHeight + 16px
- Bottom: tabBarHeight + 16px

### 5. Group Creation Screen
**Layout:**
- Header: Default with "Создать группу" title, Cancel/Create buttons
- Scrollable form

**Components:**
- Form fields:
  - Group title input (required)
  - Description textarea (optional)
  - Member search/add interface
- Selected members list with remove buttons
- Submit button: Header right (accent color text)

### 6. Audio Call Screen (Modal)
**Layout:**
- Full-screen modal
- Dark overlay background (rgba(0,0,0,0.9))
- Content centered

**Components:**
- Large avatar/initials of caller
- Username
- Call timer (MM:SS format)
- Bottom controls:
  - Mute/Unmute button (toggle state, gray/accent)
  - End call button (red #FF4B4B, large, circular)
- Visual feedback: pulsing animation while ringing

### 7. Video Call Screen (Modal)
**Layout:**
- Full-screen modal
- Remote video: Full screen
- Local video: Small preview (bottom-right corner, 100x150px)

**Components:**
- Video streams (WebRTC)
- Bottom control bar:
  - Toggle camera button
  - Mute/unmute button
  - Turn off video button
  - End call button (red)
- All buttons: White icons on semi-transparent dark background

### 8. Room (Group Call) Screen (Modal)
**Layout:**
- Full-screen modal
- Adaptive grid layout for participant videos (2x2, 3x2, etc.)

**Components:**
- Video tiles:
  - Participant video stream
  - Name label overlay (bottom, white text on dark semi-transparent background)
  - Max 10 participants
- Bottom control bar:
  - Toggle video
  - Toggle mic
  - Leave room (red button)
  - Participants list button
- Grid adjusts based on participant count

### 9. Settings Screen
**Layout:**
- Header: Transparent with "Настройки" title
- Scrollable list of settings options

**Components:**
- Profile section:
  - Avatar placeholder (editable)
  - Username display
- Settings items:
  - Simple list items with right chevron
  - Dividers between sections (#EDEDED)
- Logout button (red text)
- Account deletion (nested under Account section)

**Safe Area:**
- Top: headerHeight + 16px
- Bottom: tabBarHeight + 16px

## Visual Design Principles

### Buttons
- Primary: Accent color (#4B61FF), white text, border-radius: 8px
- Secondary: White background, accent border, accent text
- Destructive: Red (#FF4B4B)
- Icon buttons: Transparent background, tap feedback with opacity change
- Floating buttons: NO heavy shadows, use subtle opacity or border

### Input Fields
- Border: 1px solid #DADADA
- Border radius: 8px
- Padding: 12px
- Focus state: Border color changes to accent (#4B61FF)

### Visual Feedback
- Press state: Opacity 0.7
- Loading states: Simple spinner (accent color)
- Error states: Red border + red helper text

### Icons
- Use Expo vector-icons (Feather or Ionicons)
- NO emojis in UI
- Icon colors: #1A1A1A (default), #4B61FF (active/accent)

### Spacing
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px

## Accessibility
- Minimum touch target: 44x44px
- Color contrast ratio: 4.5:1 for text
- Support for system font scaling
- VoiceOver/TalkBack labels for all interactive elements

## Assets Required
- User avatar placeholders (simple circle with initials, accent color background)
- App icon (messenger theme, accent color #4B61FF)
- NO custom illustrations or complex graphics - keep minimal