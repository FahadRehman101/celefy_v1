# OneSignal Setup Guide for Celefy

## Overview
This guide explains how OneSignal is integrated into the Celefy application for push notifications.

## Current Configuration

### OneSignal App ID
- **App ID**: `b714db0f-1b9e-4b4b-87fb-1d52c3309714`
- **Safari Web ID**: `web.onesignal.auto.145f18a4-510a-4781-b676-50fa3f7fa700`

### Files Modified
1. `index.html` - OneSignal SDK initialization
2. `src/components/OneSignalTester.jsx` - UI component for testing
3. `src/utils/onesignal.js` - Utility functions
4. `public/sw.js` - Service worker
5. `public/manifest.webmanifest` - PWA manifest
6. `src/main.jsx` - Service worker registration

## How It Works

### 1. OneSignal Initialization
- OneSignal SDK loads from CDN
- Initializes with your app configuration
- Sets up push notification capabilities

### 2. Service Worker
- Handles push notifications
- Manages app caching
- Provides offline functionality

### 3. User Interface
- `OneSignalTester` component shows subscription status
- Allows users to subscribe/unsubscribe
- Provides test notification functionality

## Testing OneSignal

### Local Development
1. Run `npm run dev`
2. Open browser console to see OneSignal logs
3. Use the "Subscribe to Notifications" button
4. Check browser notification permissions

### Production Testing
1. Deploy to HTTPS domain (required for notifications)
2. Test on different browsers
3. Verify service worker registration

## Troubleshooting

### Common Issues

#### 1. "OneSignal is not ready"
- Check browser console for errors
- Ensure OneSignal SDK loaded properly
- Verify app ID is correct

#### 2. Permission denied
- Check browser notification settings
- Ensure site is HTTPS (required)
- Clear browser cache and cookies

#### 3. Service worker not registering
- Check if service worker file exists at `/sw.js`
- Verify HTTPS connection
- Check browser console for errors

### Debug Steps
1. Open browser console
2. Look for OneSignal-related logs
3. Check Network tab for failed requests
4. Verify service worker in Application tab

## Configuration Options

### OneSignal Settings
```javascript
{
  appId: "your-app-id",
  safari_web_id: "your-safari-id",
  notifyButton: { enable: true },
  allowLocalhostAsSecureOrigin: true,
  autoRegister: false,
  welcomeNotification: {
    title: "Welcome to Celefy! 🎉",
    message: "Get notified about birthdays and celebrations!"
  }
}
```

### Service Worker Features
- Push notification handling
- App caching
- Offline support
- Background sync (future)

## Security Considerations

### HTTPS Requirement
- Push notifications require HTTPS
- Service workers need secure context
- Local development uses `allowLocalhostAsSecureOrigin`

### User Privacy
- Users must explicitly opt-in
- Permission can be revoked anytime
- No automatic subscription

## Future Enhancements

### Planned Features
1. Birthday reminder notifications
2. Custom notification scheduling
3. User preference management
4. Analytics integration
5. A/B testing support

### Backend Integration
- Server-side notification sending
- User segmentation
- Notification templates
- Delivery analytics

## Support

### OneSignal Documentation
- [Web SDK Documentation](https://documentation.onesignal.com/docs/web-push-sdk-setup)
- [Service Worker Guide](https://documentation.onesignal.com/docs/service-worker-setup)
- [API Reference](https://documentation.onesignal.com/reference)

### Browser Support
- Chrome 42+
- Firefox 44+
- Safari 11.1+
- Edge 17+

## Notes
- OneSignal is now fully integrated and functional
- Test thoroughly in different browsers
- Monitor console for any errors
- Ensure HTTPS in production
