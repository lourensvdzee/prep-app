# Firebase Push Notifications Setup

This guide explains how to set up push notifications for the Prep App using FCM HTTP v1 API.

## Step 1: Create a Firebase Project (DONE)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Name it "prep-app" (or any name you prefer)
4. Disable Google Analytics if you don't need it
5. Click "Create project"

## Step 2: Register Web App (DONE)

1. In your Firebase project, click the web icon (</>) to add a web app
2. Give it a nickname like "Prep App Web"
3. Check "Also set up Firebase Hosting" if you want (optional)
4. Click "Register app"
5. Copy the firebaseConfig object - you'll need it

## Step 3: Enable Cloud Messaging (DONE)

1. Go to Project Settings (gear icon) → Cloud Messaging
2. Under "Web Push certificates", click "Generate key pair"
3. Copy the "Key pair" (VAPID key) - you'll need this

## Step 4: Create Service Account for FCM v1 API

The Legacy Cloud Messaging API is deprecated. You need a service account for the new HTTP v1 API.

### 4a: Link Firebase to Google Cloud (if not already)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project "prep-app-93f35" from the dropdown
3. If you don't see it, the Firebase project should auto-create a GCP project

### 4b: Enable Firebase Cloud Messaging API

1. In Google Cloud Console, go to "APIs & Services" → "Enabled APIs & services"
2. Click "+ ENABLE APIS AND SERVICES"
3. Search for "Firebase Cloud Messaging API" (NOT the legacy one)
4. Click on it and click "Enable"

### 4c: Create Service Account

1. In Google Cloud Console, go to "IAM & Admin" → "Service Accounts"
2. Click "CREATE SERVICE ACCOUNT"
3. Fill in:
   - Service account name: `fcm-sender`
   - Service account ID: `fcm-sender` (auto-fills)
   - Description: `Service account for sending FCM push notifications`
4. Click "CREATE AND CONTINUE"
5. Under "Grant this service account access to project", add role:
   - Click "Select a role"
   - Search for and select: "Firebase Cloud Messaging API Admin"
6. Click "CONTINUE"
7. Click "DONE"

### 4d: Create and Download Key

1. Click on the service account you just created (fcm-sender@...)
2. Go to the "KEYS" tab
3. Click "ADD KEY" → "Create new key"
4. Select "JSON" format
5. Click "CREATE"
6. A JSON file will download - keep this secure!

## Step 5: Configure Google Apps Script

1. Open the downloaded JSON key file in a text editor
2. Find these two values:
   - `client_email` (looks like `fcm-sender@prep-app-93f35.iam.gserviceaccount.com`)
   - `private_key` (long string starting with `-----BEGIN PRIVATE KEY-----`)

3. Go to your Google Apps Script project
4. Find the `setupServiceAccountCredentials()` function
5. Replace the placeholder values:

```javascript
function setupServiceAccountCredentials() {
  const props = PropertiesService.getScriptProperties();

  // Paste your client_email value here
  const serviceAccountEmail = 'fcm-sender@prep-app-93f35.iam.gserviceaccount.com';

  // Paste your private_key value here (keep the \n characters!)
  const privateKey = '-----BEGIN PRIVATE KEY-----\nMIIEvQ...your key here...7hw==\n-----END PRIVATE KEY-----\n';

  props.setProperty('FCM_SERVICE_ACCOUNT_EMAIL', serviceAccountEmail);
  props.setProperty('FCM_PRIVATE_KEY', privateKey);

  Logger.log('Service account credentials saved!');
  return { success: true, message: 'Credentials saved' };
}
```

6. Run the function ONCE by clicking the play button
7. Authorize when prompted
8. Check the execution log - should say "Service account credentials saved!"

## Step 6: Verify Setup and Deploy

1. In Apps Script, run `verifyCredentials()` to confirm credentials are saved
2. Run `testPushNotification()` to send a test notification (after enabling notifications in the app)
3. Deploy a new version:
   - Click "Deploy" → "New deployment"
   - Select type: "Web app"
   - Execute as: "Me"
   - Who has access: "Anyone"
   - Click "Deploy"
   - Copy the new URL and update your `.env` file if needed

## Step 7: Set Up Daily Trigger

1. In Apps Script, run `createDailyNotificationTrigger()`
2. This creates a trigger that runs `checkAndSendNotifications()` every day at 8:00 AM
3. Verify by going to "Triggers" (clock icon) in the left sidebar

## Step 8: Update .env file (DONE)

Your `.env` file should have:

```
VITE_GOOGLE_SCRIPT_URL=your-apps-script-url

VITE_FIREBASE_API_KEY=AIzaSyCYbH8ZpeXCts1_ma_ADkqCLDPaHbv3wnQ
VITE_FIREBASE_AUTH_DOMAIN=prep-app-93f35.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=prep-app-93f35
VITE_FIREBASE_STORAGE_BUCKET=prep-app-93f35.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=970268525390
VITE_FIREBASE_APP_ID=1:970268525390:web:48baf7b26250bbb55dd41f
VITE_FIREBASE_VAPID_KEY=BGfXx_LkWeHFoBox-my8d5TUMNvP-rPlZhgzSc8rBf5yZBNn0zjZBiyZ7gEE-VV1KzyCRFw43kSSrImOBjKGiSA
```

## iOS Specific Notes

For iOS push notifications to work:
1. User must have iOS 16.4 or later
2. User must add the app to home screen first
3. User must explicitly grant notification permission in iOS Settings → Prep App → Allow Notifications

## Notification Schedule

Notifications are sent daily at 8:00 AM for:
- Items expiring TODAY
- Items expiring in 7 days
- Items expiring in 30 days
- Items with alert date TODAY

## Troubleshooting

### "Service account credentials not configured"
Run `setupServiceAccountCredentials()` with the correct values from your JSON key file.

### "Firebase Cloud Messaging API has not been used in project"
Enable the Firebase Cloud Messaging API in Google Cloud Console (step 4b).

### "Permission denied"
Make sure the service account has the "Firebase Cloud Messaging API Admin" role.

### Test notification not received
1. Make sure notifications are enabled in the app (bell icon)
2. Check if there are tokens in the FCM_Tokens sheet in your spreadsheet
3. Run `verifyCredentials()` to check setup
4. Check the execution logs for errors
