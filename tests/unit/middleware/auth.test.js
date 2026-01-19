const authMiddleware = require('../../../src/middleware/auth');
const jwt = require('jsonwebtoken');
const UserRepository = require('../../../src/repositories/UserRepository');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../../src/repositories/UserRepository');

describe('Auth Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  let mockUserRepository;

  beforeEach(() => {
    mockReq = {
      headers: {},
      user: null
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    mockNext = jest.fn();

    mockUserRepository = {
      findById: jest.fn()
    };
    UserRepository.mockImplementation(() => mockUserRepository);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token successfully', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        role: 'user',
        is_active: true
      };

      const mockToken = 'valid_jwt_token';
      const mockDecoded = { id: 1, email: 'test@example.com' };

      mockReq.headers.authorization = `Bearer ${mockToken}`;
      jwt.verify.mockReturnValue(mockDecoded);
      mockUserRepository.findById.mockResolvedValue(mockUser);

      await authMiddleware.authenticateToken(mockReq, mockRes, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return error when no authorization header', async () => {
      await authMiddleware.authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access token required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return error when authorization header is malformed', async () => {
      mockReq.headers.authorization = 'InvalidFormat';

      await authMiddleware.authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access token required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return error when token is invalid', async () => {
      const mockToken = 'invalid_jwt_token';
      mockReq.headers.authorization = `Bearer ${mockToken}`;
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authMiddleware.authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return error when token is expired', async () => {
      const mockToken = 'expired_jwt_token';
      mockReq.headers.authorization = `Bearer ${mockToken}`;
      
      const expiredError = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => {
        throw expiredError;
      });

      await authMiddleware.authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token expired'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return error when user not found', async () => {
      const mockToken = 'valid_jwt_token';
      const mockDecoded = { id: 999, email: 'nonexistent@example.com' };

      mockReq.headers.authorization = `Bearer ${mockToken}`;
      jwt.verify.mockReturnValue(mockDecoded);
      mockUserRepository.findById.mockResolvedValue(null);

      await authMiddleware.authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return error when user is inactive', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        role: 'user',
        is_active: false
      };

      const mockToken = 'valid_jwt_token';
      const mockDecoded = { id: 1, email: 'test@example.com' };

      mockReq.headers.authorization = `Bearer ${mockToken}`;
      jwt.verify.mockReturnValue(mockDecoded);
      mockUserRepository.findById.mockResolvedValue(mockUser);

      await authMiddleware.authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Account is deactivated'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const mockToken = 'valid_jwt_token';
      const mockDecoded = { id: 1, email: 'test@example.com' };

      mockReq.headers.authorization = `Bearer ${mockToken}`;
      jwt.verify.mockReturnValue(mockDecoded);
      mockUserRepository.findById.mockRejectedValue(new Error('Database connection failed'));

      await authMiddleware.authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should allow access for correct role', async () => {
      mockReq.user = {
        id: 1,
        email: 'admin@example.com',
        role: 'admin'
      };

      const middleware = authMiddleware.requireRole('admin');
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow access for multiple roles', async () => {
      mockReq.user = {
        id: 1,
        email: 'user@example.com',
        role: 'user'
      };

      const middleware = authMiddleware.requireRole(['admin', 'user']);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access for incorrect role', async () => {
      mockReq.user = {
        id: 1,
        email: 'user@example.com',
        role: 'user'
      };

      const middleware = authMiddleware.requireRole('admin');
      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient permissions'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return error when user not authenticated', async () => {
      const middleware = authMiddleware.requireRole('admin');
      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should authenticate user when token is provided', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        role: 'user',
        is_active: true
      };

      const mockToken = 'valid_jwt_token';
      const mockDecoded = { id: 1, email: 'test@example.com' };

      mockReq.headers.authorization = `Bearer ${mockToken}`;
      jwt.verify.mockReturnValue(mockDecoded);
      mockUserRepository.findById.mockResolvedValue(mockUser);

      await authMiddleware.optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without authentication when no token provided', async () => {
      await authMiddleware.optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBeNull();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without authentication when token is invalid', async () => {
      const mockToken = 'invalid_jwt_token';
      mockReq.headers.authorization = `Bearer ${mockToken}`;
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authMiddleware.optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBeNull();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requirePermission', () => {
    it('should allow access when user has required permission', async () => {
      mockReq.user = {
        id: 1,
        email: 'admin@example.com',
        role: 'admin',
        permissions: ['users.create', 'users.read', 'users.update']
      };

      const middleware = authMiddleware.requirePermission('users.create');
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access when user lacks required permission', async () => {
      mockReq.user = {
        id: 1,
        email: 'user@example.com',
        role: 'user',
        permissions: ['messages.read']
      };

      const middleware = authMiddleware.requirePermission('users.create');
      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient permissions'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow access for admin role regardless of permissions', async () => {
      mockReq.user = {
        id: 1,
        email: 'admin@example.com',
        role: 'admin',
        permissions: []
      };

      const middleware = authMiddleware.requirePermission('any.permission');
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return error when user not authenticated', async () => {
      const middleware = authMiddleware.requirePermission('users.create');
      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireOwnership', () => {
    it('should allow access when user owns the resource', async () => {
      mockReq.user = {
        id: 1,
        email: 'user@example.com',
        role: 'user'
      };
      mockReq.params = { userId: '1' };

      const middleware = authMiddleware.requireOwnership('userId');
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow access for admin role regardless of ownership', async () => {
      mockReq.user = {
        id: 1,
        email: 'admin@example.com',
        role: 'admin'
      };
      mockReq.params = { userId: '2' };

      const middleware = authMiddleware.requireOwnership('userId');
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access when user does not own the resource', async () => {
      mockReq.user = {
        id: 1,
        email: 'user@example.com',
        role: 'user'
      };
      mockReq.params = { userId: '2' };

      const middleware = authMiddleware.requireOwnership('userId');
      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return error when user not authenticated', async () => {
      mockReq.params = { userId: '1' };

      const middleware = authMiddleware.requireOwnership('userId');
      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});