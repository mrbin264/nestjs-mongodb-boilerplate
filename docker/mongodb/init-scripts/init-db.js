// MongoDB initialization script for development
/* global db, print */
// eslint-disable-next-line no-undef
print('Initializing MongoDB for Boilerplate Backend...');

// Create development database
const devDb = db.getSiblingDB('boilerplate-dev');

// Create a development user with read/write permissions
devDb.createUser({
  user: 'devuser',
  pwd: 'devpass123',
  roles: [
    {
      role: 'readWrite',
      db: 'boilerplate-dev'
    }
  ]
});

// Create test database for testing
const testDb = db.getSiblingDB('boilerplate-test');

testDb.createUser({
  user: 'testuser',
  pwd: 'testpass123',
  roles: [
    {
      role: 'readWrite',
      db: 'boilerplate-test'
    }
  ]
});

// eslint-disable-next-line no-undef
print('MongoDB initialization completed successfully!');
print('MongoDB initialization completed successfully!');
