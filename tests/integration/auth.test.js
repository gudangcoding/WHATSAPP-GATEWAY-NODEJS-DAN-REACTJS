const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/database');

describe('Authentication Integration Tests', () => {
  let server;
  let testUser;

  beforeAll(async () => {
    // Start server
    server = app.listen(0);
    
    // Clean up test database
    await db.query('DELETE FROM users WHERE email LIKE "%test%"');
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser) {
      await db.query('DELETE FROM users WHERE id = ?', [testUser.id]);
    }
    
    // Close server and database connections
    if (server) {
      server.close();
    }
    if (db.end) {
      await db.end();
    }
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Integration Test User',
        email: 'integration.test@example.com',
        password: 'password123',
        phone: '+1234567890'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data.user.password).toBeUndefined();

      // Store test user for cleanup
      testUser = response.body.data.user;
    });

    it('should return error for duplicate email', async () => {
      const userData = {
        name: 'Duplicate User',
        email: 'integration.test@example.com', // Same email as above
        password: 'password123',
        phone: '+0987654321'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email already registered');
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        name: 'Incomplete User',
        email: 'incomplete@example.com'
        // Missing password and phone
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should validate email format', async () => {
      const invalidData = {
        name: 'Invalid Email User',
        email: 'invalid-email-format',
        password: 'password123',
        phone: '+1234567890'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should validate password strength', async () => {
      const weakPasswordData = {
        name: 'Weak Password User',
        email: 'weak.password@example.com',
        password: '123', // Too short
        phone: '+1234567890'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(weakPasswordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'integration.test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.tokens.access_token).toBeDefined();
      expect(response.body.data.tokens.refresh_token).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should return error for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return error for invalid password', async () => {
      const loginData = {
        email: 'integration.test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        email: 'integration.test@example.com'
        // Missing password
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    let accessToken;

    beforeAll(async () => {
      // Login to get access token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'integration.test@example.com',
          password: 'password123'
        });

      accessToken = loginResponse.body.data.tokens.access_token;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile retrieved successfully');
      expect(response.body.data.user.email).toBe('integration.test@example.com');
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should return error without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });

    it('should return error with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired token');
    });

    it('should return error with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });
  });

  describe('PUT /api/v1/auth/profile', () => {
    let accessToken;

    beforeAll(async () => {
      // Login to get access token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'integration.test@example.com',
          password: 'password123'
        });

      accessToken = loginResponse.body.data.tokens.access_token;
    });

    it('should update user profile successfully', async () => {
      const updateData = {
        name: 'Updated Integration Test User',
        phone: '+9876543210'
      };

      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.data.user.name).toBe(updateData.name);
      expect(response.body.data.user.phone).toBe(updateData.phone);
    });

    it('should validate update data', async () => {
      const invalidData = {
        email: 'cannot.change@example.com' // Email should not be changeable
      };

      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should return error without token', async () => {
      const updateData = {
        name: 'Should Not Update'
      };

      const response = await request(app)
        .put('/api/v1/auth/profile')
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let accessToken;

    beforeAll(async () => {
      // Login to get access token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'integration.test@example.com',
          password: 'password123'
        });

      accessToken = loginResponse.body.data.tokens.access_token;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    });

    it('should return error without token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on login attempts', async () => {
      const loginData = {
        email: 'integration.test@example.com',
        password: 'wrongpassword'
      };

      // Make multiple failed login attempts
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post('/api/v1/auth/login')
            .send(loginData)
        );
      }

      const responses = await Promise.all(promises);

      // Check that some requests are rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .expect(401);

      // Check for security headers (added by helmet)
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('0');
    });
  });

  describe('CORS', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/v1/auth/login')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });
  });
});