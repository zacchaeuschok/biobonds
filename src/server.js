import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { appRouter } from './server/api/root';
import { createContext } from './server/api/trpc/trpc';
import { prisma } from './server/db/client';

// Test database connection
async function testDbConnection() {
  try {
    // Try a simple query to test the connection
    const count = await prisma.$queryRaw`SELECT 1 as count`;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Create the tRPC HTTP server
const server = createHTTPServer({
  router: appRouter,
  createContext,
  // Do not specify a prefix here as it's causing path resolution issues
  middleware: (req, res, next) => {
    // Log incoming requests for debugging
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Handle OPTIONS request (preflight)
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    next();
  },
  onError: ({ error, req }) => {
    console.error('tRPC error:', {
      path: req.url,
      error: {
        message: error.message,
        code: error.code,
        stack: error.stack,
      },
    });
  },
});

// Start the server
async function startServer() {
  try {
    const dbConnected = await testDbConnection();
    
    if (!dbConnected) {
      console.error('Failed to start server due to database connection issues');
      process.exit(1);
    }
    
    const port = 3000;
    server.listen(port);
    console.log(`🚀 tRPC server listening on http://localhost:${port}`);
    console.log('Available routes:');
    
    // Log all available procedures
    const procedures = Object.keys(appRouter._def.procedures);
    console.log(procedures.map(p => `- ${p}`));
    
    // Log example URL for bonds.getAll
    console.log('\nExample URL for bonds.getAll:');
    console.log(`http://localhost:${port}/trpc/bonds.getAll`);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
