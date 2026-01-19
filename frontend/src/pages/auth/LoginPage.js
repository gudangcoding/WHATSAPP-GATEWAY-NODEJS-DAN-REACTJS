import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ChatBubbleLeftRightIcon,
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      // Navigate based on user role
      navigate(result.redirectTo);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <Link to="/" className="flex items-center">
              <ChatBubbleLeftRightIcon className="h-10 w-10 text-whatsapp-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">
                WhatsApp Gateway
              </span>
            </Link>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Masuk ke akun Anda
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Atau{' '}
              <Link
                to="/register"
                className="font-medium text-whatsapp-600 hover:text-whatsapp-500"
              >
                daftar akun baru
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
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
                    value={formData.email}
                    onChange={handleChange}
                  />
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="label">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="input pl-10 pr-10"
                    placeholder="Masukkan password Anda"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <LockClosedIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-whatsapp-600 focus:ring-whatsapp-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Ingat saya
                  </label>
                </div>

                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-medium text-whatsapp-600 hover:text-whatsapp-500"
                  >
                    Lupa password?
                  </Link>
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
                    'Masuk'
                  )}
                </button>
              </div>
            </form>

            {/* Demo Accounts */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Akun Demo:</h3>
              <div className="space-y-2 text-xs text-gray-600">
                <div>
                  <strong>Admin:</strong> admin@whatsapp-gateway.com / password123
                </div>
                <div>
                  <strong>User:</strong> demo@whatsapp-gateway.com / password123
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Image/Illustration */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-whatsapp-400 to-whatsapp-600 flex items-center justify-center">
          <div className="text-center text-white p-8">
            <div className="mb-8">
              <ChatBubbleLeftRightIcon className="h-24 w-24 mx-auto mb-4 opacity-80" />
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Kelola WhatsApp Bisnis dengan Mudah
            </h2>
            <p className="text-xl opacity-90 max-w-md">
              Platform terlengkap untuk mengotomatisasi dan mengoptimalkan komunikasi WhatsApp bisnis Anda.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <div className="font-semibold">Multi-Device</div>
                <div className="opacity-80">Unlimited WhatsApp</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <div className="font-semibold">Auto-Reply</div>
                <div className="opacity-80">Balasan Otomatis</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <div className="font-semibold">Campaign</div>
                <div className="opacity-80">Pesan Massal</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <div className="font-semibold">AI Integration</div>
                <div className="opacity-80">9 Fitur AI</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;