const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load keys from local files
const privateKeyPath = path.join(__dirname, 'private.pem');
const publicKeyPath = path.join(__dirname, 'public.pub');

if (!fs.existsSync(privateKeyPath) || !fs.existsSync(publicKeyPath)) {
    console.error('Error: RSA keys not found in server directory. Run openssl commands first.');
    process.exit(1);
}

const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

const manifest = {
    test: "data",
    timestamp: new Date().toISOString()
};

console.log('--- Testing RSA Signing ---');
try {
    const sign = crypto.createSign('SHA256');
    sign.update(JSON.stringify(manifest));
    sign.end();
    const signature = sign.sign(privateKey, 'hex');
    console.log('Signature generated:', signature.substring(0, 32) + '...');

    console.log('\n--- Testing RSA Verification ---');
    const verify = crypto.createVerify('SHA256');
    verify.update(JSON.stringify(manifest));
    verify.end();
    const isValid = verify.verify(publicKey, signature, 'hex');

    if (isValid) {
        console.log('✅ Verification SUCCESS');
    } else {
        console.error('❌ Verification FAILED');
        process.exit(1);
    }
} catch (err) {
    console.error('❌ Error during test:', err);
    process.exit(1);
}
