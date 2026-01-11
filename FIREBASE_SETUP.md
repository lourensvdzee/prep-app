# Firebase Push Notifications Setup

This guide explains how to set up push notifications for the Prep App using FCM HTTP v1 API.

## Progress Overview

| Step | Description | Status |
|------|-------------|--------|
| 1 | Create Firebase Project | DONE |
| 2 | Register Web App | DONE |
| 3 | Enable Cloud Messaging & VAPID Key | DONE |
| 4 | Create Service Account | DONE |
| 5 | Configure Google Apps Script | DONE |
| 6 | Deploy & Test | DONE |
| 7 | Set Up Daily Trigger | **TODO** |

---

## DONE - Step 1: Create a Firebase Project

Project created: `prep-app-93f35`

## DONE - Step 2: Register Web App

Web app registered with config:
- apiKey: `AIzaSyCYbH8ZpeXCts1_ma_ADkqCLDPaHbv3wnQ`
- authDomain: `prep-app-93f35.firebaseapp.com`
- projectId: `prep-app-93f35`
- storageBucket: `prep-app-93f35.firebasestorage.app`
- messagingSenderId: `970268525390`
- appId: `1:970268525390:web:48baf7b26250bbb55dd41f`

## DONE - Step 3: Enable Cloud Messaging

VAPID Key generated: `BGfXx_LkWeHFoBox-my8d5TUMNvP-rPlZhgzSc8rBf5yZBNn0zjZBiyZ7gEE-VV1KzyCRFw43kSSrImOBjKGiSA`

---

## DONE - Step 4: Create Service Account for FCM v1 API

The Legacy Cloud Messaging API is deprecated. You need a service account for the new HTTP v1 API.

### 4a: Enable Firebase Cloud Messaging API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project **"prep-app-93f35"** from the dropdown at the top
3. Go to **"APIs & Services"** → **"Enabled APIs & services"**
4. Click **"+ ENABLE APIS AND SERVICES"**
5. Search for **"Firebase Cloud Messaging API"** (NOT the legacy one)
6. Click on it and click **"Enable"**

### 4b: Create Service Account

1. In Google Cloud Console, go to **"IAM & Admin"** → **"Service Accounts"**
2. Click **"CREATE SERVICE ACCOUNT"**
3. Fill in:
   - Service account name: `fcm-sender`
   - Service account ID: `fcm-sender` (auto-fills)
   - Description: `Service account for sending FCM push notifications`
4. Click **"CREATE AND CONTINUE"**
5. Under "Grant this service account access to project", add role:
   - Click "Select a role"
   - Search for and select: **"Firebase Cloud Messaging API Admin"**
6. Click **"CONTINUE"**
7. Click **"DONE"**

### 4c: Create and Download Key

1. Click on the service account you just created (`fcm-sender@prep-app-93f35.iam.gserviceaccount.com`)
2. Go to the **"KEYS"** tab
3. Click **"ADD KEY"** → **"Create new key"**
4. Select **"JSON"** format
5. Click **"CREATE"**
6. A JSON file will download - keep this secure!

---

## DONE - Step 5: Configure Google Apps Script

1. Open the downloaded JSON key file in a text editor
2. Find these two values:
   - `client_email` (looks like `fcm-sender@prep-app-93f35.iam.gserviceaccount.com`)
   - `private_key` (long string starting with `-----BEGIN PRIVATE KEY-----`)

3. Go to your [Google Apps Script project](https://script.google.com)
4. Find the `setupServiceAccountCredentials()` function (near the bottom)
5. Replace the placeholder values with YOUR values from the JSON file:

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

6. **Run the function ONCE** by selecting it and clicking the play button
7. Authorize when prompted
8. Check the execution log - should say "Service account credentials saved!"

---

## DONE - Step 6: Verify Setup and Deploy

1. In Apps Script, run `verifyCredentials()` to confirm credentials are saved
2. Deploy a new version:
   - Click **"Deploy"** → **"New deployment"**
   - Select type: **"Web app"**
   - Execute as: **"Me"**
   - Who has access: **"Anyone"**
   - Click **"Deploy"**
   - Copy the new URL if it changed

3. In the app, tap the bell icon and enable notifications
4. Back in Apps Script, run `testPushNotification()` to send a test notification

---

## TODO - Step 7: Set Up Daily Trigger

1. In Apps Script, run `createDailyNotificationTrigger()`
2. This creates a trigger that runs `checkAndSendNotifications()` every day at 8:00 AM
3. Verify by going to **"Triggers"** (clock icon) in the left sidebar

---

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

### "Push notifications are not yet configured"
Complete Steps 4-6 above to configure the service account.

### "Service account credentials not configured"
Run `setupServiceAccountCredentials()` with the correct values from your JSON key file.

### "Firebase Cloud Messaging API has not been used in project"
Enable the Firebase Cloud Messaging API in Google Cloud Console (step 4a).

### "Permission denied"
Make sure the service account has the "Firebase Cloud Messaging API Admin" role.

### Test notification not received
1. Make sure notifications are enabled in the app (bell icon)
2. Check if there are tokens in the FCM_Tokens sheet in your spreadsheet
3. Run `verifyCredentials()` to check setup
4. Check the execution logs for errors
