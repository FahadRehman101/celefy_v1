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
# Copy .env.example to .env and fill in your Firebase config
cp .env.example .env
```

4. Start development server
```bash
npm run dev
```

5. Build for production
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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
