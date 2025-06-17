// Web-compatible alert replacement for React Native Alert
export const webAlert = {
  alert: (
    title: string,
    message?: string,
    buttons?: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>,
    options?: { cancelable?: boolean }
  ) => {
    // For simple alerts, use native browser confirm/alert
    if (!buttons || buttons.length === 0) {
      window.alert(message ? `${title}\n\n${message}` : title);
      return;
    }
    
    if (buttons.length === 1) {
      window.alert(message ? `${title}\n\n${message}` : title);
      buttons[0].onPress?.();
      return;
    }
    
    // For confirm dialogs with OK/Cancel
    if (buttons.length === 2) {
      const result = window.confirm(message ? `${title}\n\n${message}` : title);
      if (result) {
        // User clicked OK
        const okButton = buttons.find(b => b.style !== 'cancel') || buttons[0];
        okButton.onPress?.();
      } else {
        // User clicked Cancel
        const cancelButton = buttons.find(b => b.style === 'cancel') || buttons[1];
        cancelButton.onPress?.();
      }
      return;
    }
    
    // For more complex dialogs, fall back to simple alert
    window.alert(message ? `${title}\n\n${message}` : title);
  }
};

// Export as default for easier drop-in replacement
export default webAlert;