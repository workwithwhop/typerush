# BubbleType Game - Whop Deployment Guide

## Setup Instructions

### 1. Environment Variables
Create a `.env` file in the root directory with the following variables:

```env
# Whop App Configuration
# Get these values from your Whop Dashboard after creating an app

# Your app ID (required)
NEXT_PUBLIC_WHOP_APP_ID=your_app_id_here

# Your app API key (required)
WHOP_API_KEY=your_api_key_here

# Agent user ID (optional but recommended)
NEXT_PUBLIC_WHOP_AGENT_USER_ID=your_agent_user_id_here

# Company ID (optional)
NEXT_PUBLIC_WHOP_COMPANY_ID=your_company_id_here
```

### 2. Getting Your Whop App Credentials

1. Go to [Whop Dashboard](https://whop.com/dashboard)
2. Navigate to the Developer section
3. Create a new app or use an existing one
4. Copy the App ID and API Key from your app settings
5. Create an agent user for your app (recommended)
6. Get your Company ID from your Whop settings

### 3. Deployment

The app is now configured to work properly on the Whop platform:

- **Main page** (`/`): Shows a welcome page with instructions
- **Experience page** (`/experiences/[experienceId]`): Shows the actual game with user authentication
- **Dashboard page** (`/dashboard/[companyId]`): Shows company-specific information

### 4. How It Works on Whop

1. Users access your app through their Whop experience link
2. The app verifies their access level (admin/customer/no_access)
3. If they have access, they can play the BubbleType game
4. The game includes user information from Whop (name, username, access level)

### 5. Testing

- **Local testing**: Run `npm run dev` and test locally
- **Whop testing**: Deploy to your Whop app and test through the experience link

### 6. Features

- ✅ Full Whop integration with user authentication
- ✅ Access control based on user permissions
- ✅ Beautiful UI with animations and effects
- ✅ Score tracking and leaderboard
- ✅ Combo system for bonus points
- ✅ Ad integration for continuing the game
- ✅ Responsive design for mobile and desktop

The game should now work properly on the Whop platform!
