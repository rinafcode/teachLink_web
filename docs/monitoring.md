# Push Notifications Monitoring Dashboard

## Quick Start

1. Run `npm install` then `npm run dev`
2. Open `http://localhost:3000/system-health`
3. Click "Enable Notifications" and allow permission
4. Send a test message

## Features

- **System Health**: Real memory, CPU, uptime from Node.js
- **Notification Metrics**: Sent, Delivered, Clicked, Failed counts
- **Delivery Success Rate**: Visual progress bar
- **Event Logs**: Complete history with filters and export
- **Dark Mode**: Toggle light/dark themes
- **Auto-Refresh**: Updates every 5 seconds

## API Endpoints

- `GET /api/notifications/metrics` - System metrics
- `GET/POST/DELETE /api/notifications/track` - Event tracking
- `POST /api/notifications/send-notification` - Send test notifications
