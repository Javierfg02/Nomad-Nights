# Setup and Verification Instructions

## 1. API Key Setup (iOS Shortcuts)
To automate your location logging, you need an API Access Token:
1. Go to the **Settings** tab in the Nomad Nights dashboard.
2. Click **Generate Access Token**.
3. Copy this token and paste it into the "Token" variable in your iOS Shortcut.
4. The shortcut will now automatically include your GPS coordinates and this token in every request.

## 2. Certificate Generation
At the end of the tax year:
1. Navigate to **Settings**.
2. Select the year you wish to document.
3. Click **Download Signed Logs**.
4. This will download a `.json` manifest containing your logs, audit trail, and a cryptographic signature.

## 3. Verification Protocol (For Auditors)
A tax authority or auditor can verify the certificate using standard tools like OpenSSL:

### Requirements:
- `manifest.json`: The downloaded certificate.
- `public_key.pem`: The Server Public Key (obtainable from the Settings page).
- `signature.bin`: The signature extracted from the manifest (the `signature` field in the JSON).

### Command:
```bash
# Extract the binary signature from the JSON (manual step or via script)
# Then run:
openssl dgst -sha256 -verify public_key.pem -signature signature.bin manifest.json
```

If the data is authentic, OpenSSL will return `Verified OK`.
