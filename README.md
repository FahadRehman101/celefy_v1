# Celefy

Celefy is your smart celebration and birthday reminder app with filters, countdowns, and push notifications. Never miss a special day again.

## Features

- 🎉 Birthday tracking and reminders
- 🔔 Push notifications via OneSignal
- 🌙 Dark/Light theme support
- 📱 Progressive Web App (PWA)
- 🔥 Firebase backend integration
- 📊 Smart filtering and organization

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Auth)
- **Notifications**: OneSignal
- **PWA**: Vite PWA Plugin

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project setup

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd Celefy_v1
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
# Copy env.example to .env and fill in your configuration
cp env.example .env
```

4. Configure OneSignal (Required for push notifications)
   - Go to [OneSignal Dashboard](https://app.onesignal.com/)
   - Create a new app or use existing one
   - Copy your App ID and REST API Key
   - Update `.env` file with your OneSignal credentials:
   ```bash
   VITE_ONESIGNAL_APP_ID=your_app_id_here
   VITE_ONESIGNAL_REST_API_KEY=your_rest_api_key_here
   ```

4. Start development server
```bash
npm run dev
```

5. Start development server
```bash
npm run dev
```

6. Build for production
```bash
npm run build
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Deployment

The app is configured for deployment on:
- **Netlify** (via `netlify.toml`)
- **Firebase Hosting** (via `firebase.json`)

## Troubleshooting

### OneSignal Configuration Issues

If you see the error "OneSignal configuration missing", follow these steps:

1. **Check your `.env` file** - Ensure it contains the required OneSignal variables
2. **Verify credentials** - Double-check your App ID and REST API Key from OneSignal dashboard
3. **Restart dev server** - After updating `.env`, restart your development server
4. **Check debug panel** - Use the debug components to verify configuration status

### Common Issues

- **Push notifications not working**: Ensure HTTPS in production and proper OneSignal setup
- **Service worker errors**: Check browser console and ensure PWA files are properly configured
- **Firebase connection issues**: Verify your Firebase configuration and rules

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
