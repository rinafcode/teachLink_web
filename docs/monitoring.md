\# Push Notifications Monitoring - Simple Guide



\## What is this?



This is a dashboard that shows you how your push notifications are working. You can see:

\- If notifications are being sent

\- How many people clicked them

\- If anything is failing

\- Your server's health (memory, CPU)



\## How to Access



Open your browser and go to:

http://localhost:3000/system-health



\## What You'll See on the Dashboard



\### 1. System Health (Top section)

\- \*\*Memory Usage\*\*: How much RAM your app is using (Green = Good, Orange = Warning, Red = High)

\- \*\*CPU Usage\*\*: How much processing power is being used

\- \*\*Uptime\*\*: How long your server has been running



\### 2. Notification Stats (Middle section)

\- \*\*Sent\*\*: Number of notifications you've sent

\- \*\*Delivered\*\*: Number that actually arrived on devices

\- \*\*Clicked\*\*: Number that users clicked on

\- \*\*Failed\*\*: Number that didn't work



\### 3. Delivery Success Rate

\- A percentage showing how well your notifications are working

\- Green progress bar shows success rate visually



\### 4. Recent Events Table

\- Shows the last 15 notification events

\- Each event shows: Time, Type (Sent/Delivered/Clicked/Failed), Message, ID



\### 5. Buttons You Can Use

\- \*\*View All Logs\*\*: Opens a popup with ALL events

\- \*\*Dark Mode\*\*: Switch between light and dark colors

\- \*\*Filter\*\*: Show only specific event types (Sent only, etc.)

\- \*\*Export\*\*: Download logs as a file

\- \*\*Clear\*\*: Delete all logs



\## How to Test It



\### Step 1: Enable Notifications

Click the "Enable Notifications" button and click "Allow" when your browser asks



\### Step 2: Send a Test Message

1\. Type a message (e.g., "Hello World")

2\. Click "Send Test Notification"

3\. You'll see a popup notification on your screen



\### Step 3: Watch the Dashboard Update

\- The "Sent" number will go up

\- Your test message will appear in the Recent Events table

\- Click the notification to see "Clicked" count increase



\## API Endpoints (For Developers)



These are URLs that provide data for the dashboard:



| URL | What it does |

|-----|--------------|

| /api/notifications/metrics | Shows server health (Memory, CPU, uptime) |

| /api/notifications/track | Shows all events (List of notifications) |

| /api/notifications/send-notification | Sends a test notification |



\## Troubleshooting



\### Problem: Dashboard shows 0 events

\*\*Solution:\*\* 

1\. Make sure "Enable Notifications" is clicked

2\. Send a test message

3\. Refresh the page



\### Problem: No notification popup

\*\*Solution:\*\*

1\. Check your browser settings → Notifications → Allow

2\. Try a different browser

3\. Restart the server (Ctrl+C then npm run dev)



\### Problem: Dashboard won't load

\*\*Solution:\*\*

1\. Make sure server is running: npm run dev

2\. Check URL is correct: http://localhost:3000/system-health

3\. Look for errors in the terminal



\## File Locations



| File | What it does |

|------|--------------|

| pages/system-health.js | The dashboard you see |

| pages/api/notifications/track.js | Saves notification events |

| pages/api/notifications/metrics.js | Gets server health data |

| pages/api/notifications/send-notification.js | Sends test notifications |

| docs/monitoring.md | This documentation |



\## Need Help?



If something doesn't work:

1\. Look at the terminal (black window) for error messages

2\. Press F12 in your browser and look at the "Console" tab for red errors

3\. Try restarting: npx kill-port 3000 then npm run dev

