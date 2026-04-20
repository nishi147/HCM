const axios = require('axios');

async function testBackend() {
    try {
        const res = await axios.get('http://localhost:5000/');
        console.log('Backend status:', res.data);
    } catch (err) {
        console.error('Backend connection failed. Make sure the server is running on port 5000.');
    }
}

testBackend();
