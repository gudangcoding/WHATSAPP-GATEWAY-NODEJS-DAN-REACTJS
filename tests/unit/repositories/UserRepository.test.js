const UserRepository = require('../../../src/repositories/UserRepository');

describe('UserRepository', () => {
  let userRepository;
  let mockDb;

  beforeEach(() => {
    mockDb = global.mockDb;
    userRepository = new UserRepository();
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should find user by email successfully', async () => {
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

      mockDb.query.mockResolvedValue([[mockUser]]);

      const result = await userRepository.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL',
        ['test@example.com']
      );
    });

    it('should return null when user not found', async () => {
      mockDb.query.mockResolvedValue([[]]);

      const result = await userRepository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      mockDb.query.mockRejectedValue(new Error('Database connection failed'));

      await expect(userRepository.findByEmail('test@example.com'))
        .rejects.toThrow('Database connection failed');
    });
  });

  describe('findById', () => {
    it('should find user by ID successfully', async () => {
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

      mockDb.query.mockResolvedValue([[mockUser]]);

      const result = await userRepository.findById(1);

      expect(result).toEqual(mockUser);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL',
        [1]
      );
    });

    it('should return null when user not found', async () => {
      mockDb.query.mockResolvedValue([[]]);

      const result = await userRepository.findById(999);

      expect(result).toBeNull();
    });

    it('should handle invalid ID parameter', async () => {
      await expect(userRepository.findById(null))
        .rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create user successfully', async () => {
      const userData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'hashedPassword',
        phone: '+1234567890',
        role: 'user'
      };

      const insertResult = { insertId: 1 };
      const createdUser = {
        id: 1,
        ...userData,
        is_active: true,
        email_verified: false,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockDb.query.mockResolvedValueOnce([insertResult])
                  .mockResolvedValueOnce([[createdUser]]);

      const result = await userRepository.create(userData);

      expect(result).toEqual(createdUser);
      expect(mockDb.query).toHaveBeenCalledTimes(2);
      expect(mockDb.query).toHaveBeenNthCalledWith(1,
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining([userData.name, userData.email, userData.password, userData.phone, userData.role])
      );
    });

    it('should handle duplicate email error', async () => {
      const userData = {
        name: 'New User',
        email: 'existing@example.com',
        password: 'hashedPassword',
        phone: '+1234567890',
        role: 'user'
      };

      const duplicateError = new Error('Duplicate entry');
      duplicateError.code = 'ER_DUP_ENTRY';
      mockDb.query.mockRejectedValue(duplicateError);

      await expect(userRepository.create(userData))
        .rejects.toThrow('Duplicate entry');
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        name: 'New User'
        // Missing required fields
      };

      await expect(userRepository.create(incompleteData))
        .rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '+9876543210'
      };

      const updatedUser = {
        id: 1,
        name: 'Updated Name',
        email: 'test@example.com',
        phone: '+9876543210',
        role: 'user',
        is_active: true,
        email_verified: true,
        updated_at: new Date()
      };

      mockDb.query.mockResolvedValueOnce([{ affectedRows: 1 }])
                  .mockResolvedValueOnce([[updatedUser]]);

      const result = await userRepository.update(1, updateData);

      expect(result).toEqual(updatedUser);
      expect(mockDb.query).toHaveBeenCalledTimes(2);
      expect(mockDb.query).toHaveBeenNthCalledWith(1,
        expect.stringContaining('UPDATE users SET'),
        expect.arrayContaining([updateData.name, updateData.phone, 1])
      );
    });

    it('should return null when user not found', async () => {
      mockDb.query.mockResolvedValue([{ affectedRows: 0 }]);

      const result = await userRepository.update(999, { name: 'Updated' });

      expect(result).toBeNull();
    });

    it('should handle empty update data', async () => {
      const result = await userRepository.update(1, {});

      expect(result).toBeNull();
      expect(mockDb.query).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should soft delete user successfully', async () => {
      mockDb.query.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await userRepository.delete(1);

      expect(result).toBe(true);
      expect(mockDb.query).toHaveBeenCalledWith(
        'UPDATE users SET deleted_at = NOW() WHERE id = ?',
        [1]
      );
    });

    it('should return false when user not found', async () => {
      mockDb.query.mockResolvedValue([{ affectedRows: 0 }]);

      const result = await userRepository.delete(999);

      expect(result).toBe(false);
    });
  });

  describe('findAll', () => {
    it('should find all users with pagination', async () => {
      const mockUsers = [
        {
          id: 1,
          name: 'User 1',
          email: 'user1@example.com',
          role: 'user',
          is_active: true
        },
        {
          id: 2,
          name: 'User 2',
          email: 'user2@example.com',
          role: 'admin',
          is_active: true
        }
      ];

      const countResult = [{ total: 2 }];

      mockDb.query.mockResolvedValueOnce([[...mockUsers]])
                  .mockResolvedValueOnce([countResult]);

      const options = { page: 1, limit: 10 };
      const result = await userRepository.findAll(options);

      expect(result.data).toEqual(mockUsers);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pages).toBe(1);
    });

    it('should handle search parameter', async () => {
      mockDb.query.mockResolvedValueOnce([[]])
                  .mockResolvedValueOnce([[{ total: 0 }]]);

      const options = { search: 'test', page: 1, limit: 10 };
      await userRepository.findAll(options);

      expect(mockDb.query).toHaveBeenNthCalledWith(1,
        expect.stringContaining('WHERE'),
        expect.arrayContaining(['%test%', '%test%', 0, 10])
      );
    });

    it('should handle role filter', async () => {
      mockDb.query.mockResolvedValueOnce([[]])
                  .mockResolvedValueOnce([[{ total: 0 }]]);

      const options = { role: 'admin', page: 1, limit: 10 };
      await userRepository.findAll(options);

      expect(mockDb.query).toHaveBeenNthCalledWith(1,
        expect.stringContaining('role = ?'),
        expect.arrayContaining(['admin', 0, 10])
      );
    });

    it('should handle status filter', async () => {
      mockDb.query.mockResolvedValueOnce([[]])
                  .mockResolvedValueOnce([[{ total: 0 }]]);

      const options = { status: 'active', page: 1, limit: 10 };
      await userRepository.findAll(options);

      expect(mockDb.query).toHaveBeenNthCalledWith(1,
        expect.stringContaining('is_active = ?'),
        expect.arrayContaining([true, 0, 10])
      );
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      mockDb.query.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await userRepository.updateLastLogin(1);

      expect(result).toBe(true);
      expect(mockDb.query).toHaveBeenCalledWith(
        'UPDATE users SET last_login_at = NOW() WHERE id = ?',
        [1]
      );
    });

    it('should return false when user not found', async () => {
      mockDb.query.mockResolvedValue([{ affectedRows: 0 }]);

      const result = await userRepository.updateLastLogin(999);

      expect(result).toBe(false);
    });
  });

  describe('updatePassword', () => {
    it('should update user password successfully', async () => {
      mockDb.query.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await userRepository.updatePassword(1, 'newHashedPassword');

      expect(result).toBe(true);
      expect(mockDb.query).toHaveBeenCalledWith(
        'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
        ['newHashedPassword', 1]
      );
    });

    it('should return false when user not found', async () => {
      mockDb.query.mockResolvedValue([{ affectedRows: 0 }]);

      const result = await userRepository.updatePassword(999, 'newHashedPassword');

      expect(result).toBe(false);
    });
  });

  describe('verifyEmail', () => {
    it('should verify user email successfully', async () => {
      mockDb.query.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await userRepository.verifyEmail(1);

      expect(result).toBe(true);
      expect(mockDb.query).toHaveBeenCalledWith(
        'UPDATE users SET email_verified = true, email_verified_at = NOW(), updated_at = NOW() WHERE id = ?',
        [1]
      );
    });

    it('should return false when user not found', async () => {
      mockDb.query.mockResolvedValue([{ affectedRows: 0 }]);

      const result = await userRepository.verifyEmail(999);

      expect(result).toBe(false);
    });
  });

  describe('getStatistics', () => {
    it('should return user statistics', async () => {
      const mockStats = {
        total_users: 100,
        active_users: 85,
        verified_users: 90,
        admin_users: 5,
        new_users_today: 3,
        new_users_this_week: 15,
        new_users_this_month: 45
      };

      mockDb.query.mockResolvedValue([[mockStats]]);

      const result = await userRepository.getStatistics();

      expect(result).toEqual(mockStats);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT')
      );
    });

    it('should handle empty statistics', async () => {
      mockDb.query.mockResolvedValue([[]]);

      const result = await userRepository.getStatistics();

      expect(result).toEqual({
        total_users: 0,
        active_users: 0,
        verified_users: 0,
        admin_users: 0,
        new_users_today: 0,
        new_users_this_week: 0,
        new_users_this_month: 0
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockDb.query.mockRejectedValue(new Error('Connection lost'));

      await expect(userRepository.findByEmail('test@example.com'))
        .rejects.toThrow('Connection lost');
    });

    it('should handle SQL syntax errors', async () => {
      mockDb.query.mockRejectedValue(new Error('SQL syntax error'));

      await expect(userRepository.findAll({}))
        .rejects.toThrow('SQL syntax error');
    });

    it('should handle constraint violations', async () => {
      const constraintError = new Error('Foreign key constraint fails');
      constraintError.code = 'ER_ROW_IS_REFERENCED_2';
      mockDb.query.mockRejectedValue(constraintError);

      await expect(userRepository.delete(1))
        .rejects.toThrow('Foreign key constraint fails');
    });
  });
});