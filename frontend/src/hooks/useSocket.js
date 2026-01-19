import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import socketService, { SOCKET_EVENTS } from '../services/socket';

/**
 * Hook for managing socket connection and events
 */
export const useSocket = () => {
  const { isAuthenticated, token } = useAuth();
  const isConnecting = useRef(false);

  useEffect(() => {
    if (isAuthenticated && token && !isConnecting.current) {
      isConnecting.current = true;
      
      socketService.connect()
        .then(() => {
          console.log('Socket connected successfully');
        })
        .catch((error) => {
          console.error('Socket connection failed:', error);
        })
        .finally(() => {
          isConnecting.current = false;
        });
    }

    return () => {
      if (!isAuthenticated) {
        socketService.disconnect();
      }
    };
  }, [isAuthenticated, token]);

  const emit = useCallback((event, data, callback) => {
    return socketService.emit(event, data, callback);
  }, []);

  const on = useCallback((event, callback) => {
    return socketService.on(event, callback);
  }, []);

  const off = useCallback((event, callback) => {
    return socketService.off(event, callback);
  }, []);

  const once = useCallback((event, callback) => {
    return socketService.once(event, callback);
  }, []);

  return {
    socket: socketService,
    isConnected: socketService.isSocketConnected(),
    emit,
    on,
    off,
    once,
    joinRoom: socketService.joinRoom.bind(socketService),
    leaveRoom: socketService.leaveRoom.bind(socketService),
    getStatus: socketService.getStatus.bind(socketService)
  };
};

/**
 * Hook for device-specific socket events
 */
export const useDeviceSocket = (deviceId) => {
  const { on, off, emit } = useSocket();

  useEffect(() => {
    if (!deviceId) return;

    // Subscribe to device events
    emit('device:subscribe', { deviceId });

    return () => {
      // Unsubscribe from device events
      emit('device:unsubscribe', { deviceId });
    };
  }, [deviceId, emit]);

  const subscribeToStatus = useCallback((callback) => {
    return on(SOCKET_EVENTS.DEVICE_STATUS, (data) => {
      if (data.deviceId === deviceId) {
        callback(data);
      }
    });
  }, [deviceId, on]);

  const subscribeToQR = useCallback((callback) => {
    return on(SOCKET_EVENTS.DEVICE_QR, (data) => {
      if (data.deviceId === deviceId) {
        callback(data);
      }
    });
  }, [deviceId, on]);

  const subscribeToMessages = useCallback((callback) => {
    return on(SOCKET_EVENTS.DEVICE_MESSAGE, (data) => {
      if (data.deviceId === deviceId) {
        callback(data);
      }
    });
  }, [deviceId, on]);

  return {
    subscribeToStatus,
    subscribeToQR,
    subscribeToMessages
  };
};

/**
 * Hook for campaign-specific socket events
 */
export const useCampaignSocket = (campaignId) => {
  const { on, off, emit } = useSocket();

  useEffect(() => {
    if (!campaignId) return;

    // Subscribe to campaign events
    emit('campaign:subscribe', { campaignId });

    return () => {
      // Unsubscribe from campaign events
      emit('campaign:unsubscribe', { campaignId });
    };
  }, [campaignId, emit]);

  const subscribeToProgress = useCallback((callback) => {
    return on(SOCKET_EVENTS.CAMPAIGN_PROGRESS, (data) => {
      if (data.campaignId === campaignId) {
        callback(data);
      }
    });
  }, [campaignId, on]);

  const subscribeToStatus = useCallback((callback) => {
    const events = [
      SOCKET_EVENTS.CAMPAIGN_STARTED,
      SOCKET_EVENTS.CAMPAIGN_COMPLETED,
      SOCKET_EVENTS.CAMPAIGN_PAUSED,
      SOCKET_EVENTS.CAMPAIGN_STOPPED,
      SOCKET_EVENTS.CAMPAIGN_ERROR
    ];

    const unsubscribers = events.map(event => 
      on(event, (data) => {
        if (data.campaignId === campaignId) {
          callback({ ...data, event });
        }
      })
    );

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [campaignId, on]);

  return {
    subscribeToProgress,
    subscribeToStatus
  };
};

/**
 * Hook for message-specific socket events
 */
export const useMessageSocket = () => {
  const { on } = useSocket();

  const subscribeToMessageStatus = useCallback((callback) => {
    const events = [
      SOCKET_EVENTS.MESSAGE_SENT,
      SOCKET_EVENTS.MESSAGE_DELIVERED,
      SOCKET_EVENTS.MESSAGE_READ,
      SOCKET_EVENTS.MESSAGE_FAILED
    ];

    const unsubscribers = events.map(event => 
      on(event, (data) => {
        callback({ ...data, event });
      })
    );

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [on]);

  const subscribeToIncomingMessages = useCallback((callback) => {
    return on(SOCKET_EVENTS.MESSAGE_RECEIVED, callback);
  }, [on]);

  return {
    subscribeToMessageStatus,
    subscribeToIncomingMessages
  };
};

/**
 * Hook for system notifications
 */
export const useSystemSocket = () => {
  const { on } = useSocket();

  const subscribeToNotifications = useCallback((callback) => {
    return on(SOCKET_EVENTS.SYSTEM_NOTIFICATION, callback);
  }, [on]);

  const subscribeToMaintenance = useCallback((callback) => {
    return on(SOCKET_EVENTS.SYSTEM_MAINTENANCE, callback);
  }, [on]);

  const subscribeToQuotaWarnings = useCallback((callback) => {
    const events = [
      SOCKET_EVENTS.USER_QUOTA_WARNING,
      SOCKET_EVENTS.USER_QUOTA_EXCEEDED
    ];

    const unsubscribers = events.map(event => 
      on(event, (data) => {
        callback({ ...data, event });
      })
    );

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [on]);

  return {
    subscribeToNotifications,
    subscribeToMaintenance,
    subscribeToQuotaWarnings
  };
};

export default useSocket;