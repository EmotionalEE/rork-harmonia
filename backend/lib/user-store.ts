import bcrypt from 'bcryptjs';

const PASSWORD_SALT_ROUNDS = Number(process.env.PASSWORD_SALT_ROUNDS || 10);

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
}

class UserStore {
  private users: Map<string, User> = new Map();
  private initialized: boolean = false;

  async initialize() {
    if (this.initialized) {
      console.log('[UserStore] Already initialized');
      return;
    }
    
    const seedEmail = process.env.SEED_USER_EMAIL;
    const seedPassword = process.env.SEED_USER_PASSWORD;
    const seedName = process.env.SEED_USER_NAME || 'Seed User';

    if (!seedEmail || !seedPassword) {
      this.initialized = true;
      console.log('[UserStore] Initialized without seed users');
      return;
    }

    console.log('[UserStore] Initializing with seed user...');
    try {
      const testPassword = await bcrypt.hash(seedPassword, PASSWORD_SALT_ROUNDS);
      const testUser: User = {
        id: 'test_user_1',
        email: normalizeEmail(seedEmail),
        passwordHash: testPassword,
        name: seedName.trim(),
        createdAt: new Date().toISOString(),
      };
      this.users.set(testUser.id, testUser);
      this.initialized = true;
      console.log('[UserStore] Seed user created:', testUser.email);
      console.log('[UserStore] Total users:', this.users.size);
    } catch (error) {
      console.error('[UserStore] Initialization failed:', error);
      throw error;
    }
  }

  async createUser(email: string, password: string, name: string): Promise<User> {
    await this.initialize();

    const normalizedEmail = normalizeEmail(email);
    const normalizedName = name.trim();

    const existingUser = Array.from(this.users.values()).find(u => u.email === normalizedEmail);
    
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      email: normalizedEmail,
      passwordHash,
      name: normalizedName,
      createdAt: new Date().toISOString(),
    };

    this.users.set(user.id, user);
    console.log('[UserStore] User created:', user.email);
    return user;
  }

  async findUserByEmail(email: string): Promise<User | undefined> {
    await this.initialize();
    const normalizedEmail = normalizeEmail(email);
    const user = Array.from(this.users.values()).find(u => u.email === normalizedEmail);
    console.log(`[UserStore] findUserByEmail(${email}): ${user ? 'found' : 'not found'}`);
    console.log(`[UserStore] Total users in store: ${this.users.size}`);
    return user;
  }

  async findUserById(id: string): Promise<User | undefined> {
    await this.initialize();
    return this.users.get(id);
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async getAllUsers(): Promise<User[]> {
    await this.initialize();
    return Array.from(this.users.values());
  }
}

export const userStore = new UserStore();
