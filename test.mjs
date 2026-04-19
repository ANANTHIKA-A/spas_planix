import fetch from 'node-fetch';

async function testAPI() {
  try {
    console.log('1. Trying to login/register test_user...');
    let res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test_user', password: 'testpassword' })
    });
    console.log('Login Status:', res.status);
    let data = await res.json();
    console.log('Login Response:', data);

    console.log('\n2. Adding a task for test_user...');
    let bulkRes = await fetch('http://localhost:5000/api/tasks/bulk?userId=test_user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{
        id: '123',
        title: 'Test Task',
        description: 'Testing',
        priority: 'high',
        difficulty: 'hard',
        deadline: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        status: 'pending'
      }])
    });
    console.log('Bulk Post Status:', bulkRes.status);
    console.log('Bulk Post Response:', await bulkRes.json());
    
    console.log('\n3. Fetching tasks for test_user...');
    let getRes = await fetch('http://localhost:5000/api/tasks?userId=test_user');
    console.log('Get Tasks Status:', getRes.status);
    console.log('Get Tasks Response:', await getRes.json());
    
  } catch(e) {
    console.error('Test script error:', e);
  }
}

testAPI();
