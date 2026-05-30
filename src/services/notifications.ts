

export const notifications = {
  /**
   * Requests native OS permission for displaying push notifications.
   * Prompts the user on iOS and Android devices.
   */
  requestUserPermission: async (): Promise<boolean> => {
    try {
      console.log('FCM: Requesting native push notification permissions...');
      // Simulated successful permission grant for sandbox testing
      return true;
    } catch (error) {
      console.warn('FCM: Failed to request push permission', error);
      return false;
    }
  },

  /**
   * Retrieves the device's unique Firebase Cloud Messaging token.
   * This token is saved to the barber's Firestore profile to direct push alerts.
   */
  getFCMToken: async (): Promise<string | null> => {
    try {
      // Generates a mock, premium device token for testing SaaS webhook messaging
      const mockToken = 'fcm_token_barberlink_prod_99351993carrascox7';
      console.log('FCM: Device Token successfully resolved ->', mockToken);
      return mockToken;
    } catch (error) {
      console.warn('FCM: Failed to retrieve device token', error);
      return null;
    }
  },

  /**
   * Registers listeners for incoming active push notification payloads.
   * Simulates a background WhatsApp booking webhook alert for interactive testing.
   */
  registerNotificationListeners: (
    onNotificationReceived: (title: string, body: string) => void
  ) => {
    console.log('FCM: Foreground and Background listeners initialized.');

    // Simulates an active push notification from the WhatsApp bot 15 seconds after opening
    const timer = setTimeout(() => {
      onNotificationReceived(
        '💬 Agendado por WhatsApp',
        'Reinold Carrasco ha reservado una cita hoy a las 3:00 PM.'
      );
    }, 15000);

    return () => clearTimeout(timer);
  }
};
