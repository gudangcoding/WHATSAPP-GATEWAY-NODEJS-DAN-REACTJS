# Authentication Troubleshooting Guide

## 🔍 Masalah yang Diperbaiki

### 1. **Masalah: Setelah login berhasil, halaman refresh kembali ke login**

**Penyebab:**
- AuthContext tidak menangani token verification dengan benar
- API interceptor terlalu agresif menghapus token saat ada error
- User state tidak di-preserve saat page refresh

**Solusi yang Diterapkan:**

#### A. Perbaikan AuthContext (`frontend/src/contexts/AuthContext.js`)
```javascript
// Sebelum: Langsung verify token, jika gagal hapus semua
// Sesudah: Set state dari storage dulu, lalu verify di background
useEffect(() => {
  const initAuth = async () => {
    const savedToken = getStoredToken();
    const savedUser = getStoredUser();
    
    if (savedToken && savedUser) {
      // Set initial state from storage FIRST
      setUser(savedUser);
      setToken(savedToken);
      setIsAuthenticated(true);
      setPermissions(getRolePermissions(savedUser.role));
      
      // Then verify in background
      try {
        const response = await authAPI.getProfile();
        // Update if different
      } catch (error) {
        // Only clear if 401, keep for network errors
        if (error.status === 401) {
          // Clear auth
        }
      }
    }
  };
}, []);
```

#### B. Perbaikan API Client (`frontend/src/services/api/apiClient.js`)
```javascript
// Perbaikan response interceptor
if (error.response?.status === HTTP_STATUS.UNAUTHORIZED && !originalRequest._retry) {
  originalRequest._retry = true;
  
  // Only try refresh if we have refresh token and not login request
  const refreshToken = localStorage.getItem(APP_CONFIG.storage.auth.refreshToken);
  const isLoginRequest = originalRequest.url?.includes('/auth/login');
  
  if (refreshToken && !isLoginRequest) {
    // Try refresh
  } else if (!isLoginRequest) {
    // Handle auth error
  }
}
```

#### C. Perbaikan App.js Routes
```javascript
// Sebelum: user?.role === 'admin' || user?.role === 'super_admin'
// Sesudah: (user?.role === 'admin' || user?.role === 'super_admin')
// Menambahkan parentheses untuk operator precedence yang benar
```

### 2. **Masalah: Error "Cannot read properties of undefined (reading 'role')"**

**Penyebab:**
- User object undefined saat component render
- Race condition antara loading state dan user state

**Solusi yang Diterapkan:**

#### A. Safe Navigation di App.js
```javascript
// Gunakan optional chaining dan parentheses
element={(user?.role === 'admin' || user?.role === 'super_admin') ? <AdminDashboard /> : <Navigate to="/dashboard" />}
```

#### B. Proper Loading State
```javascript
// AuthContext menangani loading state dengan benar
if (loading) {
  return <LoadingSpinner />;
}
```

#### C. Cross-tab Synchronization
```javascript
// Listen for storage changes
const handleStorageChange = (event) => {
  if (event.key === APP_CONFIG.storage.auth.token && !event.newValue && isAuthenticated) {
    // Token was removed in another tab
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setPermissions([]);
  }
};
```

## 🛠️ Tools untuk Debugging

### 1. Debug Utilities (`frontend/src/utils/debug.js`)

```javascript
// Panggil di browser console untuk debug
debugAuth(); // Lihat semua auth data
clearAllAuthData(); // Hapus semua auth data
```

### 2. Console Logging
AuthContext sekarang memiliki detailed logging:
```
🚀 Initializing auth...
📦 Saved token exists: true
👤 Saved user exists: true
✅ Setting initial auth state from storage
🔄 Verifying token with server...
✅ Token verified, user data: {...}
```

## 🔧 Cara Troubleshooting

### 1. **Jika masih redirect ke login setelah login berhasil:**

```javascript
// 1. Buka browser console
// 2. Jalankan debug
debugAuth();

// 3. Periksa apakah token dan user tersimpan
// 4. Jika tidak ada, periksa network tab untuk response login
// 5. Jika ada tapi masih redirect, periksa console untuk error
```

### 2. **Jika ada error "Cannot read properties of undefined":**

```javascript
// 1. Periksa apakah AuthProvider membungkus App
// 2. Periksa loading state
// 3. Pastikan semua user?.role menggunakan optional chaining
```

### 3. **Jika token hilang setelah refresh:**

```javascript
// 1. Periksa localStorage
localStorage.getItem('whatsapp_gateway_token');
localStorage.getItem('whatsapp_gateway_user');

// 2. Jika ada tapi masih hilang, periksa API response
// 3. Periksa network tab untuk 401 errors
```

## 📋 Checklist Perbaikan

### ✅ **Yang Sudah Diperbaiki:**

1. **AuthContext Initialization**
   - ✅ Set state dari storage terlebih dahulu
   - ✅ Verify token di background
   - ✅ Hanya clear auth jika benar-benar 401
   - ✅ Handle network errors dengan graceful

2. **API Client**
   - ✅ Perbaikan response interceptor
   - ✅ Tidak terlalu agresif menghapus token
   - ✅ Handle refresh token dengan benar
   - ✅ Skip refresh untuk login requests

3. **App.js Routes**
   - ✅ Safe navigation dengan optional chaining
   - ✅ Proper operator precedence
   - ✅ Loading state handling

4. **Cross-tab Synchronization**
   - ✅ Listen storage changes
   - ✅ Sync auth state across tabs

5. **Debug Tools**
   - ✅ Debug utilities
   - ✅ Console logging
   - ✅ Clear auth data function

### 🔄 **Flow Authentication yang Benar:**

```
1. User buka aplikasi
   ↓
2. AuthContext cek localStorage
   ↓
3. Jika ada token & user:
   - Set state dari storage (immediate)
   - Verify token di background
   - Update jika ada perubahan
   ↓
4. Jika tidak ada:
   - Set state kosong
   - Redirect ke login
   ↓
5. User login:
   - Simpan token & user
   - Set auth state
   - Redirect ke dashboard
   ↓
6. User refresh page:
   - Kembali ke step 2
   - State di-restore dari storage
```

## 🚨 **Hal yang Perlu Diperhatikan:**

1. **Jangan hapus token terlalu cepat** - Beri kesempatan untuk network retry
2. **Gunakan optional chaining** - Selalu `user?.role` bukan `user.role`
3. **Handle loading state** - Jangan render component sebelum auth ready
4. **Debug dengan console** - Gunakan debug utilities untuk troubleshooting
5. **Test cross-tab** - Pastikan logout di satu tab mempengaruhi tab lain

## 📞 **Jika Masih Ada Masalah:**

1. Buka browser console
2. Jalankan `debugAuth()`
3. Periksa network tab untuk API calls
4. Periksa localStorage untuk token
5. Periksa console untuk error messages
6. Jika perlu, jalankan `clearAllAuthData()` dan login ulang

---

**Status: ✅ FIXED - Authentication flow sekarang bekerja dengan benar**