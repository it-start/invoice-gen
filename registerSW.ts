export const registerSW = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    console.log('Notification permission granted.');
    return true;
  }
  return false;
};

// Helper to convert VAPID key for subscription
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const subscribeToPush = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Request permission if not already granted
      const granted = await requestNotificationPermission();
      if (!granted) return;

      // Note: Typically you would fetch the VAPID Public Key from your API
      // const response = await fetch('/api/vapid-key');
      // const { publicKey } = await response.json();
      
      // Placeholder for VAPID Key - Replace with actual key from env/api
      const publicVapidKey = ''; 

      if (publicVapidKey) {
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });

        console.log('User is subscribed:', subscription);
        
        // Send subscription to backend
        // await fetch('/api/subscribe', {
        //   method: 'POST',
        //   body: JSON.stringify(subscription),
        //   headers: { 'Content-Type': 'application/json' }
        // });
      }
    } catch (error) {
      console.error('Failed to subscribe to push notifications', error);
    }
  }
};