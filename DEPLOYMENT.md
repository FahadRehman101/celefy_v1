# Celefy Deployment Guide

## OneSignal Setup Status ✅

The OneSignal integration has been properly configured and tested. Here's what's been set up:

### ✅ What's Working:
1. **OneSignal SDK Integration**: Properly loaded from CDN
2. **Service Worker Registration**: OneSignal worker registered first, then custom PWA worker
3. **Push Notification Handling**: Custom notification display with actions
4. **Permission Management**: Subscribe/unsubscribe functionality
5. **Debug Information**: Enhanced testing component with detailed status

### 🔧 Configuration:
- **App ID**: `b714db0f-1b9e-4b4b-87fb-1d52c3309714`
- **Safari Web ID**: `web.onesignal.auto.145f18a4-510a-4781-b676-50fa3f7fa700`
- **Service Workers**: Properly configured to avoid conflicts

## Deploy to Netlify

### Option 1: Drag & Drop (Recommended for testing)
1. Run `npm run build` to create the `dist` folder
2. Go to [netlify.com](https://netlify.com) and sign up/login
3. Drag the `dist` folder to the Netlify dashboard
4. Your site will be deployed instantly

### Option 2: Git Integration
1. Push your code to GitHub
2. Connect your GitHub repo to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Deploy automatically on every push

### Option 3: Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

## Testing OneSignal After Deployment

1. **Visit your deployed site** (not localhost)
2. **Check the OneSignal tester component** - it should show:
   - ✅ OneSignal Available
   - ✅ Service Worker
   - ✅ Notifications supported
3. **Click "Subscribe to Notifications"** - browser should ask for permission
4. **Grant permission** - status should change to "Subscribed"
5. **Test notification** - should work on deployed site

## Why Localhost Doesn't Work

OneSignal has limitations on localhost:
- **HTTPS Required**: OneSignal needs HTTPS for security
- **Service Worker Scope**: Limited service worker functionality on localhost
- **Browser Restrictions**: Modern browsers restrict push notifications on localhost

## Troubleshooting

### If OneSignal still doesn't work after deployment:
1. **Check browser console** for errors
2. **Verify App ID** in OneSignal dashboard
3. **Check service worker registration** in DevTools > Application
4. **Ensure HTTPS** is enabled on your domain
5. **Clear browser cache** and reload

### Common Issues:
- **Service Worker Conflict**: Make sure OneSignal worker loads first
- **Permission Denied**: User must manually grant notification permission
- **App ID Mismatch**: Verify the App ID in your OneSignal dashboard

## OneSignal Dashboard Setup

Make sure your OneSignal app is configured:
1. **Web Push Settings**: Enable web push notifications
2. **Site Settings**: Add your deployed domain
3. **VAPID Keys**: Should be automatically generated
4. **Test Notifications**: Use the dashboard to send test notifications

## Next Steps

After successful deployment:
1. **Test push notifications** from OneSignal dashboard
2. **Monitor analytics** in OneSignal dashboard
3. **Set up automated notifications** for birthdays
4. **Configure notification templates** for better UX

---

**Note**: OneSignal will only work properly on the deployed HTTPS site, not on localhost. This is a security feature, not a bug!
