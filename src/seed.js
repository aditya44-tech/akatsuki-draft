import 'dotenv/config';
import { connectDB, closeDB } from './config/db.js';
import User from './models/User.js';
import Post from './models/Post.js';

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    console.log('[Seed] Clearing existing collections...');
    await User.deleteMany({});
    await Post.deleteMany({});

    console.log('[Seed] Creating default users...');
    const adminUser = await User.create({
      name: 'Pain (Nagato)',
      email: 'admin@akatsuki.dev',
      password: 'Admin@123',
      role: 'admin',
    });

    const authorUser = await User.create({
      name: 'Itachi Uchiha',
      email: 'author@akatsuki.dev',
      password: 'Author@123',
      role: 'user',
    });

    const standardUser = await User.create({
      name: 'Sasori',
      email: 'user@akatsuki.dev',
      password: 'User@123',
      role: 'user',
    });

    console.log('[Seed] Creating sample posts...');
    await Post.create([
      {
        title: 'Mastering Full-Stack Architecture with Node.js & MongoDB',
        description: 'A deep-dive into scalable REST APIs, authentication patterns, and data persistence in Nodevember.',
        content: `Building modern backend systems requires precision, clean abstractions, and robust error handling. In this post, we explore how layered architecture separates database operations, domain logic, and HTTP routing for effortless maintenance and scaling.`,
        category: 'Technology',
        createdBy: authorUser._id,
        status: 'approved',
        createdAt: new Date(Date.now() - 86400000 * 2),
      },
      {
        title: 'The Art of GenAI in Collaborative Writing Systems',
        description: 'How Google Gemini revolutionizes content polishing while preserving draft history.',
        content: `Draft preservation is critical when integrating AI into editorial pipelines. Writers need to retain their original words while exploring refined phrasing, clarity enhancements, and structured formatting. Akatsuki's Draft brings this to life.`,
        category: 'Artificial Intelligence',
        createdBy: authorUser._id,
        status: 'approved',
        createdAt: new Date(Date.now() - 86400000),
      },
      {
        title: 'Puppet Master: Automating Microservice Workflows',
        description: 'Pending review: An architectural exploration into decoupled job workers.',
        content: `Complex distributed systems often suffer from tight coupling. By utilizing asynchronous queues and worker pools, we can achieve high throughput with minimal resource exhaustion.`,
        category: 'DevOps',
        createdBy: standardUser._id,
        status: 'pending',
        createdAt: new Date(),
      },
      {
        title: 'Draft: Secrets of the Sharingan',
        description: 'Personal notes and draft reflections on perceptive code debugging.',
        content: `A raw, unpolished draft exploring visual pattern recognition in application observability and tracing.`,
        category: 'Philosophy',
        createdBy: authorUser._id,
        status: 'draft',
        createdAt: new Date(),
      },
    ]);

    console.log('====================================================');
    console.log('  Database seeded successfully!');
    console.log('  Admin:    admin@akatsuki.dev  / Admin@123  (Role: admin)');
    console.log('  Author:   author@akatsuki.dev / Author@123 (Role: user)');
    console.log('  User:     user@akatsuki.dev   / User@123   (Role: user)');
    console.log('====================================================');

    await closeDB();
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error seeding database:', err);
    await closeDB();
    process.exit(1);
  }
};

seedDatabase();
