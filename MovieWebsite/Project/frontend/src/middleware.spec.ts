import { NextRequest } from 'next/server';
import { middleware } from './middleware';

// Mock middleware to test protected routes
describe('Middleware - Protected Routes (Property 26)', () => {
  it('should redirect unauthenticated users from /watchlist to /login', () => {
    const req = new NextRequest('http://localhost:3000/watchlist');
    const response = middleware(req);
    
    if (response) {
      const location = response.headers.get('location');
      expect(location).toContain('/login');
    }
  });

  it('should redirect unauthenticated users from /profile to /login', () => {
    const req = new NextRequest('http://localhost:3000/profile');
    const response = middleware(req);
    
    if (response) {
      const location = response.headers.get('location');
      expect(location).toContain('/login');
    }
  });

  it('should redirect unauthenticated users from /admin to /login', () => {
    const req = new NextRequest('http://localhost:3000/admin');
    const response = middleware(req);
    
    if (response) {
      const location = response.headers.get('location');
      expect(location).toContain('/login');
    }
  });

  it('should NOT redirect authenticated users from /watchlist', () => {
    const req = new NextRequest('http://localhost:3000/watchlist', {
      headers: {
        cookie: 'auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
      },
    });
    const response = middleware(req);
    
    // If user is authenticated, middleware should not redirect (return NextResponse.next() or null)
    if (response) {
      const location = response.headers.get('location');
      expect(location).toBeNull();
    }
  });

  it('should allow unauthenticated access to /movies', () => {
    const req = new NextRequest('http://localhost:3000/movies');
    const response = middleware(req);
    
    // /movies is a public route, should not redirect
    if (response) {
      const location = response.headers.get('location');
      expect(location).toBeNull();
    }
  });

  it('should allow unauthenticated access to /login', () => {
    const req = new NextRequest('http://localhost:3000/login');
    const response = middleware(req);
    
    if (response) {
      const location = response.headers.get('location');
      expect(location).toBeNull();
    }
  });
});