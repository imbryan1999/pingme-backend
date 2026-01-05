import admin from "../config/firebase.js";

const sendPushNotification = async (token, title, body, data = {}) => {
  if (!token) {
    console.log("❌ No FCM token, skipping push");
    return;
  }

  const message = {
    token,
    notification: {
        title,
        body,
    },
    data,
};

  try {
    await admin.messaging().send(message);
    console.log("✅ Push sent to single device");
  } catch (error) {
    console.error("❌ Push error:", error.message);
  }
};

export { sendPushNotification };
