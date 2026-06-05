export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ready',
      message: 'Send notification endpoint is working',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST or GET.' });
  }

  try {
    const { userId, title, body, url } = req.body;
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    console.log('\n🚀 ========== SENDING NOTIFICATION ==========');
    console.log(`   📤 Notification ID: ${notificationId}`);
    console.log(`   👤 User: ${userId || 'anonymous'}`);
    console.log(`   📝 Title: ${title || 'Test Notification'}`);
    console.log(`   💬 Message: "${body || 'No message'}"`);
    console.log(`   🔗 URL: ${url || '/'}`);
    console.log('=============================================\n');

    const trackResponse = await fetch('http://localhost:3000/api/notifications/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId: notificationId,
        event: 'sent',
        userId: userId || 'anonymous',
        timestamp: new Date().toISOString(),
        message: body,
        title: title,
      }),
    });

    if (!trackResponse.ok) {
      console.error('[⚠️ WARNING] Track endpoint returned:', trackResponse.status);
    }

    console.log(`✅ Notification sent successfully: ${notificationId}`);

    res.status(200).json({
      success: true,
      notificationId: notificationId,
      message: 'Notification sent successfully',
      content: body,
    });
  } catch (error) {
    console.error('\n❌ ========== ERROR SENDING NOTIFICATION ==========');
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    console.error('==================================================\n');

    res.status(500).json({
      error: 'Failed to send notification',
      details: error.message,
    });
  }
}
