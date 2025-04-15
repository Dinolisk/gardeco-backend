import request from 'supertest';
import app from '../server.js'; // Adjust the import based on your server setup

describe('Transaction Check Request', () => {
  it('should respond with a success message', async () => {
    const response = await request(app)
      .post('/transaction-check')
      .send({
        transactionId: '12345',
        customerConsents: ['consent1', 'consent2']
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Transaction check successful');
  });
});
