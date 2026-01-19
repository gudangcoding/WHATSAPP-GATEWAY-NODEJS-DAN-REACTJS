const request = require('supertest');
const express = require('express');
const AuthController = require('../../../src/controllers/AuthController');
const UserRepository = require('../../../src/repositories/UserRepository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../../../src/repositories/UserRepository');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthController', () => {
  let app;
  let mockUserRepository;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Setup routes
    app.post('/register', AuthController.register);
    app.post('/login', AuthController.login);
    app.get('/profile', AuthController.getProfile);
    app.put('/profile', AuthController.updateProfile);
    app.post('/logout', AuthController.logout);

    // Reset mocks
    mockUserRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      updateLastLogin: jest.fn()
    };
    UserRepository.mockImplementation(() => mockUserRepository);
  });

  describe('POST /register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '+1234567890'
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedPassword');
      mockUserRepository.create.mockResolvedValue({
        id: 1,
        ...userData,
        password: 'hashedPassword'
      });

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 12);
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('should return error if email already exists', async () => {
      const userData = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
        phone: '+1234567890'
      };

      mockUserRepository.findByEmail.mockResolvedValue({ id: 1, email: userData.email });

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email already registered');
    });

    it('should return validation error for invalid email', async () => {
      const userData = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123',
        phone: '+1234567890'
      };

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should return validation error for short password', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: '123',
        phone: '+1234567890'
      };

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });
  });

  describe('POST /login', () => {
    it('should login user successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        id: 1,
        email: loginData.email,
        password: 'hashedPassword',
        name: 'Test User',
        role: 'user',
        is_active: true,
        email_verified: true
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValueOnce('access_token').mockReturnValueOnce('refresh_token');
      mockUserRepository.updateLastLogin.mockResolvedValue();

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.tokens.access_token).toBe('access_token');
      expect(response.body.data.tokens.refresh_token).toBe('refresh_token');
    });

    it('should return error for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return error for invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const mockUser = {
        id: 1,
        email: loginData.email,
        password: 'hashedPassword',
        is_active: true,
        email_verified: true
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return error for inactive user', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        id: 1,
        email: loginData.email,
        password: 'hashedPassword',
        is_active: false,
        email_verified: true
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Account is deactivated');
    });

    it('should return error for unverified email', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        id: 1,
        email: loginData.email,
        password: 'hashedPassword',
        is_active: true,
        email_verified: false
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Please verify your email first');
    });
  });

  describe('GET /profile', () => {
    it('should return user profile successfully', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        role: 'user',
        is_active: true,
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Mock request with user
      const mockReq = { user: { id: 1 } };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);

      await AuthController.getProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile retrieved successfully',
        data: { user: expect.objectContaining({ email: mockUser.email }) }
      });
    });

    it('should return error if user not found', async () => {
      const mockReq = { user: { id: 999 } };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      mockUserRepository.findById.mockResolvedValue(null);

      await AuthController.getProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });
  });

  describe('PUT /profile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '+9876543210'
      };

      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890'
      };

      const updatedUser = {
        ...mockUser,
        ...updateData
      };

      const mockReq = { 
        user: { id: 1 },
        body: updateData
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      await AuthController.updateProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile updated successfully',
        data: { user: expect.objectContaining({ name: updateData.name }) }
      });
    });

    it('should return error if user not found', async () => {
      const mockReq = { 
        user: { id: 999 },
        body: { name: 'Updated Name' }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      mockUserRepository.findById.mockResolvedValue(null);

      await AuthController.updateProfile(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });
  });

  describe('POST /logout', () => {
    it('should logout user successfully', async () => {
      const mockReq = { user: { id: 1 } };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await AuthController.logout(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '+1234567890'
      };

      mockUserRepository.findByEmail.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Internal server error');
    });

    it('should handle JWT signing errors', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        id: 1,
        email: loginData.email,
        password: 'hashedPassword',
        is_active: true,
        email_verified: true
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockImplementation(() => {
        throw new Error('JWT signing failed');
      });

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Internal server error');
    });
  });
});