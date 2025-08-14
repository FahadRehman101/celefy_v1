# 🚀 Development Environment Setup Guide

## OneSignal Configuration for Localhost

### 1. Create Local Environment File

Create a `.env.local` file in your project root with the following content:

```bash
# 🔒 Local Development Environment Variables
# This file is for localhost development only - DO NOT commit to production

# Firebase Configuration (REQUIRED)
# Get these from your Firebase project settings
VITE_FIREBASE_API_KEY=your_actual_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_actual_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_actual_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_actual_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
VITE_FIREBASE_APP_ID=your_actual_app_id

# OneSignal Configuration (REQUIRED for notifications)
# Get these from your OneSignal dashboard
VITE_ONESIGNAL_APP_ID=b714db0f-1b9e-4b4b-87fb-1d52c3309714
VITE_ONESIGNAL_REST_API_KEY=your_actual_onesignal_rest_api_key
VITE_ONESIGNAL_SAFARI_WEB_ID=web.onesignal.auto.145f18a4-510a-4781-b676-50fa3f7fa700

# Development Mode
NODE_ENV=development
VITE_DEV_MODE=true
```

### 2. OneSignal Dashboard Configuration

In your OneSignal dashboard:

1. **Go to Settings > Web Configuration**
2. **Add localhost domains:**
   - `http://localhost:3000`
   - `http://localhost:3001`
   - `http://localhost:3002`
   - `http://127.0.0.1:3000`
   - `http://127.0.0.1:3001`
   - `http://127.0.0.1:3002`

3. **Enable HTTP for localhost:**
   - Check "Allow HTTP for localhost"
   - This allows OneSignal to work on localhost without HTTPS

### 3. Restart Development Server

After creating the `.env.local` file:

```bash
# Stop your current dev server (Ctrl+C)
# Then restart it
npm run dev
# or
yarn dev
```

## 🧪 **Comprehensive Testing Guide**

### **Phase 1: Basic OneSignal Functionality Test**

1. **Check browser console** for OneSignal initialization messages
2. **Look for the OneSignalTester component** in your Dashboard
3. **Check environment warning** - should show "Development Environment"

**Expected Console Logs:**
```
🔧 Starting OneSignal initialization...
🔧 Environment detected: { hostname: 'localhost', isLocalhost: true }
🔧 Adding localhost-specific options
✅ OneSignal initialized successfully
```

### **Phase 2: Notification Permission Test**

1. **Click "Subscribe to Notifications"** in OneSignalTester
2. **Allow permission** when browser prompts
3. **Verify you see a Player ID** in the status

**Expected Results:**
- ✅ SDK Loaded: ✅
- ✅ Subscribed: ✅
- ✅ Permission: granted
- ✅ Player ID: [some-long-string]

### **Phase 3: Notification Scheduling Test**

1. **Click "Test Notification Scheduling"** in OneSignalTester
2. **Check console logs** for detailed scheduling information

**Expected Console Logs:**
```
🧪 Testing notification scheduling...
🔍 Testing OneSignal SDK availability...
✅ OneSignal SDK is available
🧪 Testing immediate notification...
✅ SDK notification test successful
🧪 Testing birthday reminder scheduling...
🎂 === ENHANCED BIRTHDAY REMINDER SCHEDULING ===
🔍 Pre-scheduling OneSignal API detection...
🔍 Detecting OneSignal v16 API capabilities...
✅ OneSignal API methods available: [list of methods]
🎯 Recommended method: [method name]
⏰ birthday_reminder_7d scheduled for: [future date]
⏰ birthday_reminder_7d timing validation: { delayDays: X, isValid: true }
🎯 SUCCESS: birthday_reminder_7d → Notification ID: [unique-id]
📋 Scheduling Details: { method: [method], scheduledFor: [ISO date], delayFromNow: "X days, Y hours" }
🎊 === ENHANCED SCHEDULING COMPLETE ===
✅ Successfully scheduled 3 notifications
📊 Enhanced Scheduling Summary: [detailed summary]
✅ All notifications properly scheduled for future delivery
```

### **Phase 4: Birthday Addition Test**

1. **Add a birthday** using the Add Birthday modal
2. **Check console logs** for scheduling information
3. **Verify NO immediate notifications** appear

**Expected Behavior:**
- ✅ Birthday saves successfully
- ✅ 3 notifications are scheduled (7 days, 1 day, and birthday)
- ✅ **NO notifications appear immediately**
- ✅ Console shows detailed scheduling information
- ✅ Each notification gets a unique ID

### **Phase 5: Validation Checks**

**✅ What Should Happen:**
- Notifications are scheduled for future dates
- Each notification gets a unique ID
- Console shows detailed timing information
- No immediate delivery warnings

**❌ What Should NOT Happen:**
- Notifications appearing immediately
- `'no-id'` errors
- Immediate delivery warnings
- Missing timing information

## 🔧 **Troubleshooting**

### **If Notifications Still Appear Immediately:**

1. **Check console logs** for scheduling method used
2. **Look for "WARNING: Some notifications may be delivered immediately"**
3. **Verify API capabilities** are detected correctly
4. **Check if browser fallback** is being used

### **If Scheduling Fails:**

1. **Check OneSignal API detection** logs
2. **Verify OneSignal SDK** is fully loaded
3. **Check for API method errors** in console
4. **Ensure timezone calculations** are correct

### **If No Notifications Are Scheduled:**

1. **Check permission status** in OneSignalTester
2. **Verify OneSignal configuration** is correct
3. **Check for API capability detection** errors
4. **Ensure birthday dates** are in the future

## 🚀 **Production Testing**

After localhost testing works perfectly:

1. **Deploy to Netlify**
2. **Test in incognito tab** at `https://celefy.netlify.app`
3. **Verify full functionality** in production environment
4. **Check that notifications** are properly scheduled (not immediate)

## 📋 **Success Criteria**

Your notification system is **100% ready for launch** when:

- ✅ **No immediate notifications** when adding birthdays
- ✅ **All 3 notifications scheduled** for future dates
- ✅ **Unique IDs returned** for each notification
- ✅ **Detailed timing information** in console logs
- ✅ **No scheduling warnings** or errors
- ✅ **Works on both localhost and production**

## 🎯 **Next Steps**

Once testing is complete:

1. **Verify all functionality** works perfectly
2. **Test edge cases** (past dates, timezone changes)
3. **Deploy to production** with confidence
4. **Monitor notification delivery** in OneSignal dashboard

---

**Remember**: The key success indicator is that **NOTIFICATIONS SHOULD NOT APPEAR IMMEDIATELY** when you add a birthday. They should be scheduled for the calculated future dates (7 days before, 1 day before, and on the birthday).
