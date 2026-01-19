import React, { useState, useEffect } from 'react';
import { 
  DevicePhoneMobileIcon,
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  TrashIcon,
  QrCodeIcon,
  SignalIcon,
  SignalSlashIcon
} from '@heroicons/react/24/outline';
import Card from '../common/Card';
import Button from '../common/Button';
import { StatusBadge } from '../common/Badge';
import Modal from '../common/Modal';
import { useDeviceSocket } from '../../hooks/useSocket';
import QRCode from 'react-qr-code';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

const DeviceCard = ({ 
  device, 
  onStart, 
  onStop, 
  onRestart, 
  onDelete,
  onShowQR,
  loading = false 
}) => {
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [deviceStatus, setDeviceStatus] = useState(device.status);
  const [lastSeen, setLastSeen] = useState(device.last_seen);

  // Subscribe to device socket events
  const { subscribeToStatus, subscribeToQR } = useDeviceSocket(device.id);

  useEffect(() => {
    // Subscribe to device status updates
    const unsubscribeStatus = subscribeToStatus((data) => {
      setDeviceStatus(data.status);
      setLastSeen(data.timestamp);
    });

    // Subscribe to QR code updates
    const unsubscribeQR = subscribeToQR((data) => {
      setQrCode(data.qr);
      if (data.qr && qrModalOpen) {
        // QR code updated while modal is open
      }
    });

    return () => {
      unsubscribeStatus();
      unsubscribeQR();
    };
  }, [subscribeToStatus, subscribeToQR, qrModalOpen]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'pairing':
        return 'warning';
      case 'disconnected':
        return 'danger';
      case 'banned':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <SignalIcon className="w-4 h-4" />;
      case 'pairing':
        return <QrCodeIcon className="w-4 h-4" />;
      case 'disconnected':
      case 'banned':
        return <SignalSlashIcon className="w-4 h-4" />;
      default:
        return <DevicePhoneMobileIcon className="w-4 h-4" />;
    }
  };

  const handleShowQR = async () => {
    setQrModalOpen(true);
    if (onShowQR) {
      const qrData = await onShowQR(device.id);
      if (qrData) {
        setQrCode(qrData);
      }
    }
  };

  const canStart = deviceStatus === 'disconnected' && !loading;
  const canStop = ['connected', 'pairing'].includes(deviceStatus) && !loading;
  const canRestart = deviceStatus === 'connected' && !loading;
  const canShowQR = deviceStatus === 'pairing';

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DevicePhoneMobileIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {device.name}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {device.phone_number || 'No phone number'}
              </p>
              
              <div className="mt-2 flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  {getStatusIcon(deviceStatus)}
                  <StatusBadge status={deviceStatus} />
                </div>
                
                {lastSeen && (
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(lastSeen), { 
                      addSuffix: true,
                      locale: id 
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {canShowQR && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleShowQR}
                icon={<QrCodeIcon className="w-4 h-4" />}
              >
                QR
              </Button>
            )}
            
            {canStart && (
              <Button
                size="sm"
                variant="success"
                onClick={() => onStart(device.id)}
                loading={loading}
                icon={<PlayIcon className="w-4 h-4" />}
              >
                Start
              </Button>
            )}
            
            {canStop && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => onStop(device.id)}
                loading={loading}
                icon={<StopIcon className="w-4 h-4" />}
              >
                Stop
              </Button>
            )}
            
            {canRestart && (
              <Button
                size="sm"
                variant="warning"
                onClick={() => onRestart(device.id)}
                loading={loading}
                icon={<ArrowPathIcon className="w-4 h-4" />}
              >
                Restart
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(device.id)}
              loading={loading}
              icon={<TrashIcon className="w-4 h-4" />}
            />
          </div>
        </div>
        
        {/* Device Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {device.stats?.messages_sent || 0}
            </div>
            <div className="text-xs text-gray-500">Messages Sent</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {device.stats?.messages_received || 0}
            </div>
            <div className="text-xs text-gray-500">Messages Received</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {device.stats?.uptime_percentage || 0}%
            </div>
            <div className="text-xs text-gray-500">Uptime</div>
          </div>
        </div>
      </Card>

      {/* QR Code Modal */}
      <Modal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title={`QR Code - ${device.name}`}
        size="md"
      >
        <div className="text-center">
          {qrCode ? (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg inline-block">
                <QRCode value={qrCode} size={256} />
              </div>
              <div className="text-sm text-gray-600">
                <p>Scan this QR code with WhatsApp on your phone:</p>
                <ol className="mt-2 text-left space-y-1">
                  <li>1. Open WhatsApp on your phone</li>
                  <li>2. Go to Settings → Linked Devices</li>
                  <li>3. Tap "Link a Device"</li>
                  <li>4. Scan this QR code</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading QR code...</p>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default DeviceCard;