import { createAuth, Env } from "./auth";


export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle Better Auth API routes
    if (url.pathname.startsWith('/api/auth/')) {
      try {
        const auth = createAuth(env);
        return auth.handler(request);
      } catch (error) {
        console.error('Auth handler error:', error);
        return new Response(JSON.stringify({ 
          error: 'Internal server error', 
          details: error.message 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Handle static file serving for the website
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Cranberry Hearing & Balance Center - Business Sale</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-50 min-h-screen">
          <div class="max-w-4xl mx-auto py-8 px-4">
            <h1 class="text-3xl font-bold text-gray-900 mb-8">Cranberry Hearing & Balance Center</h1>
            <p class="text-lg text-gray-600 mb-6">Business Sale Overview</p>
            
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 class="text-xl font-semibold mb-4">Due Diligence Documents</h2>
              <p class="text-gray-600 mb-4">Access comprehensive business information and financial data.</p>
              <a href="/docs" class="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                View Documents
              </a>
            </div>
            
            <div class="bg-white rounded-lg shadow-md p-6">
              <h2 class="text-xl font-semibold mb-4">Authentication</h2>
              <p class="text-gray-600 mb-4">Sign up or sign in to access protected content.</p>
              <div class="space-x-4">
                <a href="/signup" class="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                  Sign Up
                </a>
                <a href="/docs" class="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Sign In
                </a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    // Handle signup page
    if (url.pathname === '/signup') {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Sign Up - Cranberry Hearing & Balance</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-50 min-h-screen flex items-center justify-center">
          <div class="max-w-md w-full bg-white rounded-lg shadow-md p-6">
            <h1 class="text-2xl font-bold text-gray-900 mb-4">Create Account</h1>
            <p class="text-gray-600 mb-6">Sign up to access due diligence documents.</p>
            
            <form id="signup-form" class="space-y-4">
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" id="name" required 
                       class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" id="email" required 
                       class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div>
                <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                <input type="password" id="password" required 
                       class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              </div>
              <button type="submit" 
                      class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Create Account
              </button>
            </form>
            
            <p class="mt-4 text-center text-sm text-gray-600">
              Already have an account? <a href="/docs" class="text-blue-600 hover:text-blue-500">Sign in</a>
            </p>
            
            <div id="error-message" class="mt-4 hidden p-3 bg-red-100 border border-red-400 text-red-700 rounded"></div>
            <div id="success-message" class="mt-4 hidden p-3 bg-green-100 border border-green-400 text-green-700 rounded"></div>
          </div>
          
          <script>
            // Better Auth client for browser usage
            class AuthClient {
              constructor() {
                this.baseURL = "/api/auth";
              }

              async signUpEmail({ email, password, name }) {
                try {
                  const response = await fetch(\`\${this.baseURL}/sign-up/email\`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password, name }),
                    credentials: 'include'
                  });

                  const data = await response.json();
                  
                  if (!response.ok) {
                    return { error: { message: data.message || 'Sign up failed' } };
                  }
                  
                  return { data };
                } catch (error) {
                  return { error: { message: error.message } };
                }
              }
            }

            // Create and make auth client available globally
            const authClient = new AuthClient();
            window.authClient = authClient;

            document.getElementById('signup-form').addEventListener('submit', async (e) => {
              e.preventDefault();
              const name = document.getElementById('name').value;
              const email = document.getElementById('email').value;
              const password = document.getElementById('password').value;
              const errorDiv = document.getElementById('error-message');
              const successDiv = document.getElementById('success-message');
              
              try {
                const result = await window.authClient.signUpEmail({
                  email,
                  password,
                  name
                });
                
                if (result.error) {
                  errorDiv.textContent = 'Sign up failed: ' + result.error.message;
                  errorDiv.classList.remove('hidden');
                  successDiv.classList.add('hidden');
                } else {
                  successDiv.textContent = 'Account created successfully! Redirecting to sign in...';
                  successDiv.classList.remove('hidden');
                  errorDiv.classList.add('hidden');
                  setTimeout(() => {
                    window.location.href = '/docs';
                  }, 2000);
                }
              } catch (error) {
                errorDiv.textContent = 'An error occurred: ' + error.message;
                errorDiv.classList.remove('hidden');
                successDiv.classList.add('hidden');
              }
            });
          </script>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    // Handle protected docs page
    if (url.pathname === '/docs' || url.pathname === '/docs.html') {
      try {
        const auth = createAuth(env);
        
        // Check for Better Auth session
        const session = await auth.api.getSession({
          headers: request.headers
        });

        if (!session) {
          return new Response(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Authentication Required</title>
              <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body class="bg-gray-50 min-h-screen flex items-center justify-center">
              <div class="max-w-md w-full bg-white rounded-lg shadow-md p-6">
                <h1 class="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
                <p class="text-gray-600 mb-6">Please sign in to access the due diligence documents.</p>
                
                <form id="signin-form" class="space-y-4">
                  <div>
                    <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" id="email" required 
                           class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                  </div>
                  <div>
                    <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                    <input type="password" id="password" required 
                           class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                  </div>
                  <button type="submit" 
                          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Sign In
                  </button>
                </form>
                
                <p class="mt-4 text-center text-sm text-gray-600">
                  Don't have an account? <a href="/signup" class="text-blue-600 hover:text-blue-500">Sign up</a>
                </p>
                
                <div id="error-message" class="mt-4 hidden p-3 bg-red-100 border border-red-400 text-red-700 rounded"></div>
              </div>
              
              <script>
                // Better Auth client for browser usage
                class AuthClient {
                  constructor() {
                    this.baseURL = "/api/auth";
                  }

                  async signInEmail({ email, password }) {
                    try {
                      const response = await fetch(\`\${this.baseURL}/sign-in/email\`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email, password }),
                        credentials: 'include'
                      });

                      const data = await response.json();
                      
                      if (!response.ok) {
                        return { error: { message: data.message || 'Sign in failed' } };
                      }
                      
                      return { data };
                    } catch (error) {
                      return { error: { message: error.message } };
                    }
                  }

                  async signOut() {
                    try {
                      const response = await fetch(\`\${this.baseURL}/sign-out\`, {
                        method: 'POST',
                        credentials: 'include'
                      });

                      if (!response.ok) {
                        throw new Error('Sign out failed');
                      }
                    } catch (error) {
                      console.error('Sign out error:', error);
                    }
                  }
                }

                // Create and make auth client available globally
                const authClient = new AuthClient();
                window.authClient = authClient;

                document.getElementById('signin-form').addEventListener('submit', async (e) => {
                  e.preventDefault();
                  const email = document.getElementById('email').value;
                  const password = document.getElementById('password').value;
                  const errorDiv = document.getElementById('error-message');
                  
                  try {
                    const result = await window.authClient.signInEmail({
                      email,
                      password
                    });
                    
                    if (result.error) {
                      errorDiv.textContent = 'Sign in failed: ' + result.error.message;
                      errorDiv.classList.remove('hidden');
                    } else {
                      window.location.reload();
                    }
                  } catch (error) {
                    errorDiv.textContent = 'An error occurred: ' + error.message;
                    errorDiv.classList.remove('hidden');
                  }
                });
              </script>
            </body>
            </html>
          `, {
            status: 401,
            headers: { 'Content-Type': 'text/html' }
          });
        }

        // User is authenticated, show protected content
        return new Response(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Due Diligence Documents - Cranberry Hearing & Balance</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-gray-50 min-h-screen">
            <div class="max-w-4xl mx-auto py-8 px-4">
              <div class="flex justify-between items-center mb-8">
                <h1 class="text-3xl font-bold text-gray-900">Due Diligence Documents</h1>
                <button id="signout-btn" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                  Sign Out
                </button>
              </div>
              
              <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="text-xl font-semibold mb-4">Welcome, \${session.user.name}!</h2>
                <p class="text-gray-600 mb-6">You have access to the following business documents:</p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="border rounded-lg p-4">
                    <h3 class="font-semibold mb-2">Financial Reports</h3>
                    <p class="text-sm text-gray-600 mb-3">Balance sheets, P&L statements, and tax documents</p>
                    <button class="text-blue-600 hover:text-blue-800">View Reports</button>
                  </div>
                  
                  <div class="border rounded-lg p-4">
                    <h3 class="font-semibold mb-2">Equipment Analysis</h3>
                    <p class="text-sm text-gray-600 mb-3">Audiometer and hearing aid equipment details</p>
                    <button class="text-blue-600 hover:text-blue-800">View Equipment</button>
                  </div>
                  
                  <div class="border rounded-lg p-4">
                    <h3 class="font-semibold mb-2">Sales Data</h3>
                    <p class="text-sm text-gray-600 mb-3">Historical sales performance and trends</p>
                    <button class="text-blue-600 hover:text-blue-800">View Sales</button>
                  </div>
                  
                  <div class="border rounded-lg p-4">
                    <h3 class="font-semibold mb-2">Legal Documents</h3>
                    <p class="text-sm text-gray-600 mb-3">Leases, insurance, and legal agreements</p>
                    <button class="text-blue-600 hover:text-blue-800">View Legal</button>
                  </div>
                </div>
              </div>
            </div>
            
            <script>
              // Better Auth client for browser usage
              class AuthClient {
                constructor() {
                  this.baseURL = "/api/auth";
                }

                async signOut() {
                  try {
                    const response = await fetch(\`\${this.baseURL}/sign-out\`, {
                      method: 'POST',
                      credentials: 'include'
                    });

                    if (!response.ok) {
                      throw new Error('Sign out failed');
                    }
                  } catch (error) {
                    console.error('Sign out error:', error);
                  }
                }
              }

              // Create and make auth client available globally
              const authClient = new AuthClient();
              window.authClient = authClient;

              document.getElementById('signout-btn').addEventListener('click', async () => {
                await window.authClient.signOut();
                window.location.href = '/';
              });
            </script>
          </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html' }
        });
      } catch (error) {
        console.error('Error checking session:', error);
        return new Response('Internal server error', { status: 500 });
      }
    }
    
    // Handle 404 for other routes
    return new Response('Not Found', { status: 404 });
  },
};
