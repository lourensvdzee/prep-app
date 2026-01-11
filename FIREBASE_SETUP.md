# Firebase Push Notifications Setup

This guide explains how to set up push notifications for the Prep App.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Name it "prep-app" (or any name you prefer)
4. Disable Google Analytics if you don't need it
5. Click "Create project"

## Step 2: Register Web App

1. In your Firebase project, click the web icon (</>) to add a web app
2. Give it a nickname like "Prep App Web"
3. Check "Also set up Firebase Hosting" if you want (optional)
4. Click "Register app"
5. Copy the firebaseConfig object - you'll need it

## Step 3: Enable Cloud Messaging

1. Go to Project Settings (gear icon) → Cloud Messaging
2. Under "Web Push certificates", click "Generate key pair"
3. Copy the "Key pair" (VAPID key) - you'll need this

## Step 4: Get Server Key (for Google Apps Script)

1. In Project Settings → Cloud Messaging
2. Copy the "Server key" (under Cloud Messaging API - Legacy)
3. You'll use this in Google Apps Script to send notifications

## Step 5: Update .env file

Add these to your `.env` file:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_VAPID_KEY=your-vapid-key
```

## Step 6: Update Google Apps Script

Add the FCM_SERVER_KEY to your Google Apps Script properties:
1. In Apps Script, go to Project Settings
2. Add a script property: `FCM_SERVER_KEY` with your server key value

## iOS Specific Notes

For iOS push notifications to work:
1. User must have iOS 16.4 or later
2. User must add the app to home screen first
3. User must explicitly grant notification permission in iOS Settings → Prep App → Allow Notifications

## Testing

After setup:
1. Open the app
2. Grant notification permission when prompted
3. The app will register your device token with Firebase
4. Notifications will be scheduled based on expiration dates
