// scripts/test-sms-fixed.mjs
import axios from 'axios';

const API_KEY = 'ky671zbahoaim3ondm4ioc7qtkt6onr7';
const BASE_URL = 'https://restapi.easysendsms.app/v1/rest/sms/send';

// Helper for cleaning and formatting numbers
const cleanNumbers = (to) => to.split(',')
  .map(num => {
    let cleaned = num.trim().replace(/\s+/g, '').replace(/^\+/, '').replace(/^00/, '');
    // If the number is 8 digits (Tunisian format), prepend 216
    if (cleaned.length === 8 && /^\d+$/.test(cleaned)) {
      cleaned = '216' + cleaned;
    }
    return cleaned;
  })
  .join(',');

async function testImmediateSend() {
  const number = '52961932';
  const cleaned = cleanNumbers(number);
  const text = 'Test message for IMMEDIATE delivery with fixed number format';

  console.log(`Original: ${number}`);
  console.log(`Cleaned (should be 21692131827): ${cleaned}`);
  console.log(`Sending IMMEDIATELY...`);

  try {
    const payload = {
      from: 'EasySend',
      to: cleaned,
      text,
      type: "0",
    };
    console.log('Sending Payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(
      BASE_URL,
      payload,
      {
        headers: {
          'apikey': API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('Full API Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testImmediateSend();
