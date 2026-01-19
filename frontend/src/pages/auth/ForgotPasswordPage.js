import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await forgotPassword(email);
    
    if (result.success) {
      setSent(true);
    }
    
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-whatsapp-600" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Email Terkirim!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Kami telah mengirimkan link reset password ke email Anda.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <EnvelopeIcon className="mx-auto h-16 w-16 text-whatsapp-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Cek Email Anda
              </h3>
              <p className="text-gray-600 mb-6">
                Kami telah mengirimkan instruksi reset password ke:
              </p>
              <p className="font-medium text-gray-900 mb-6">
                {email}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Tidak menerima email? Cek folder spam atau coba kirim ulang.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => setSent(false)}
                  className="w-full btn-outline"
                >
                  Kirim Ulang
                </button>
                <Link
                  to="/login"
                  className="w-full btn-primary"
                >
                  Kembali ke Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link to="/login" className="flex items-center text-whatsapp-600 hover:text-whatsapp-500 mb-6">
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Kembali ke Login
          </Link>
          
          <div className="text-center">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-whatsapp-600" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Lupa Password?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Masukkan email Anda dan kami akan mengirimkan link untuk reset password.
            </p>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <div className="mt-1 relative">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input pl-10"
                placeholder="Masukkan email Anda"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <EnvelopeIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-success flex justify-center py-3"
            >
              {loading ? (
                <LoadingSpinner size="sm" color="white" />
              ) : (
                'Kirim Link Reset'
              )}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Ingat password Anda?{' '}
            <Link
              to="/login"
              className="font-medium text-whatsapp-600 hover:text-whatsapp-500"
            >
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;