import toast from 'react-hot-toast';


export const formatErrorMessage = (error: any): string => {
  
  if (error.code === 4001 || error.code === 'ACTION_REJECTED' || error.message?.includes('user rejected') || error.message?.includes('User rejected')) {
    return 'Transaction rejected';
  }

  
  if (error.message?.includes('insufficient funds')) {
    return 'Insufficient funds for transaction';
  }

  
  if (error.message?.includes('network') || error.message?.includes('Network')) {
    return 'Network error. Please check your connection';
  }

  
  if (error.message?.includes('revert')) {
    const revertMatch = error.message.match(/reason="([^"]+)"/);
    if (revertMatch) {
      return revertMatch[1];
    }
    return 'Transaction failed';
  }

  
  if (error.message?.includes('gas')) {
    return 'Transaction may fail. Check your balance';
  }

  
  if (error.message) {
    
    const shortMessage = error.message.split('\n')[0].split('(')[0].trim();
    if (shortMessage.length < 100) {
      return shortMessage;
    }
  }

  return 'Transaction failed';
};


export const showToast = {
  success: (message: string, duration = 3000) => {
    toast.success(message, {
      duration,
      style: {
        background: '#10b981',
        color: '#fff',
        fontWeight: '500',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#10b981',
      },
    });
  },

  error: (message: string | any, duration = 4000) => {
    
    const formattedMessage = typeof message === 'string' ? message : formatErrorMessage(message);

    toast.error(formattedMessage, {
      duration,
      style: {
        background: '#ef4444',
        color: '#fff',
        fontWeight: '500',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#ef4444',
      },
    });
  },

  loading: (message: string, id?: string) => {
    return toast.loading(message, {
      id,
      style: {
        background: '#3b82f6',
        color: '#fff',
        fontWeight: '500',
      },
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages, {
      style: {
        minWidth: '250px',
      },
      success: {
        style: {
          background: '#10b981',
          color: '#fff',
        },
      },
      error: {
        style: {
          background: '#ef4444',
          color: '#fff',
        },
      },
      loading: {
        style: {
          background: '#3b82f6',
          color: '#fff',
        },
      },
    });
  },

  info: (message: string, duration = 3000) => {
    toast(message, {
      duration,
      icon: 'ℹ️',
      style: {
        background: '#3b82f6',
        color: '#fff',
        fontWeight: '500',
      },
    });
  },

  custom: (message: string, options?: any) => {
    toast(message, options);
  },
};