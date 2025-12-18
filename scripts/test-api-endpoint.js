// Test API Endpoint
fetch('/api/admin/courses/cmj60q9dk0000b5aa0wy836o2')
  .then(res => {
    console.log('Status:', res.status);
    return res.json();
  })
  .then(data => console.log('Response:', data))
  .catch(err => console.error('Error:', err));
