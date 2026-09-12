import { createServer } from 'http';

const TEST_EMAIL = 'test@apax.com';
const TEST_PASSWORD = 'password123';

const server = createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.method === 'POST' && req.url === '/user/login') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      const { email, password } = JSON.parse(body || '{}');
      res.setHeader('Content-Type', 'application/json');

      if (email === TEST_EMAIL && password === TEST_PASSWORD) {
        res.writeHead(200);
        res.end(
          JSON.stringify({
            success: true,
            token: 'mock-jwt-token',
            user: { _id: '1', name: 'Test User', email, role: 'user' },
          })
        );
      } else {
        res.writeHead(401);
        res.end(JSON.stringify({ success: false, message: 'Invalid Email or Password' }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ success: false, message: 'Not found' }));
});

server.listen(4000, () => console.log('Mock APAX backend running on http://localhost:4000'));
