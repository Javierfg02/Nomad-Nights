# Nomad Nights: Digital Residency Proof

Nomad Nights is a high-fidelity tracking and compliance system designed for digital nomads to prove their physical presence in specific countries for tax and residency purposes.

## 1. What is it?
A secure logging system that combines client-side location data (GPS) with server-side metadata (IP addresses, timestamps) to create cryptographically signed, audit-ready compliance records.

## 2. Why use it?
Tax authorities (like the IRS or European Tax Offices) require irrefutable proof of where you spent your time. Manual spreadsheets are easily manipulated and often dismissed. Nomad Nights provides **Digital Irrefutability**: data that is captured in real-time and cannot be "fudged" at the end of the year.

## 3. Who is it for?
- **Digital Nomads**: Anyone living across multiple borders.
- **Remote Workers**: Employees needing to prove "Work from Anywhere" compliance.
- **Tax Professionals**: Auditors looking for high-integrity evidence.

---

<a name="setup"></a>
## 4. Setup Instructions (iOS)
To automate your logs, you must configure the Nomad Nights Shortcut on your device.

### Step 1: Download the Shortcut
[Download Nomad Nights iOS Shortcut](https://www.icloud.com/shortcuts/45fa496027a446be8cdc891b7ca93659)

### Step 2: Configure the API Key
1.  Go to the **Settings** page in your Nomad Nights dashboard.
2.  Click **Generate Connection Key** and copy the resulting string.
3.  Open the iOS Shortcuts app, find "Nomad Nights", and tap the three dots (`...`) to edit.
4.  Find the step named "Get contents of https://nomad-nights.web.app/api/log/" and click on the arrow button to expand the menu. Under "Headers", find the Authorization header and replace `API_CONNECTIVITY_KEY_HERE` (usually in a text block) with your **copied key**. Leave the `Bearer` prefix.

### Step 3: Automate Daily
1.  In the Shortcuts app, tap the **Automation** tab.
2.  Tap `+` -> **Create Personal Automation** -> **Time of Day**.
3.  Set it to **11:55 PM** daily.
4.  Add the action **Run Shortcut** and select "Nomad Nights".
5.  Turn off "Ask Before Running".

---

<a name="records"></a>
## 5. Understanding Your Records
At the end of the year, you can download your **Compliance Manifest** (`.json`).
- **Data Integrity**: Contains every log entry, including GPS coordinates and the IP address used.
- **Audit Trail**: Every change (edit/delete) is recorded with a server timestamp, preventing retrospective data manipulation.
- **Signature**: The entire file is signed with a 2048-bit RSA Private Key held only by the Nomad Nights server.

---

<a name="verification"></a>
## 6. Verification (For Auditors)
A third party can verify the authenticity of your records using a single terminal command.

### Prepare Files
1.  Save your records as `records.json`.
2.  Copy your **Server Public Key** from the Settings dashboard and save it as `public.pem`.
    *   *Tip: Use `cat > public.pem` in terminal and paste the key to avoid macOS Keychain errors.*

### Run Verification
Copy and paste this command into your terminal:
```bash
python3 -c "import json; d=json.load(open('records.json')); open('data.json', 'w').write(json.dumps(d['manifest'], separators=(',', ':'), ensure_ascii=False)); open('sig.bin', 'wb').write(bytes.fromhex(d['signature']))" && openssl dgst -sha256 -verify public.pem -signature sig.bin data.json
```
**Expected Outcome**: `Verified OK`

---

## 7. Technical Theory & Structure
The system rests on the **Theory of Digital Irrefutability**:
1.  **Something you did**: Logged location via Shortcut.
2.  **Somewhere you were**: GPS + IP verification.
3.  **When you were there**: Immutable server-side timestamps.

### Project Structure
- `/client`: React-based dashboard for viewing logs and managing keys.
- `/server`: Node.js/Express backend handling authentication, Firestore logging, and RSA signing.
- `/firebase.json`: Hosting and security rules configuration.
