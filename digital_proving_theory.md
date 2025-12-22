# Theory of Digital Irrefutability

Nomad Nights employs a defense-in-depth approach to digital proving, ensuring that residency data is not just recorded, but cryptographically secured and auditable.

## 1. Cryptographic Signing (RSA-2048)
Every compliance manifest is signed using a server-side RSA Private Key. 
- **Integrity**: Any modification to the data (logs or audit trail) after generation will invalidate the signature.
- **Authenticity**: Using the Public Key, anyone (including tax authorities) can verify that the document was indeed issued by the Nomad Nights server.

## 2. Metadata Integrity
The system captures high-fidelity metadata that is difficult to forge retrospectively:
- **Client IP**: Records the network address from which the log was sent.
- **GPS Coordinates**: Real-time location data from the user's device (iOS).
- **Server Timestamps**: All entries are marked with immutable server-side `updated_at` timestamps.

## 3. Blockchain-Inspired Audit Trail
While not a public blockchain, Nomad Nights maintains a linear, immutable-ish audit trail in Firestore:
- Every CREATE, UPDATE, or DELETE action is logged.
- The state of the data before and after the change is preserved.
- This creates a historical record of the user's presence that is extremely difficult to "fudge" at the end of the year.

## 4. Theory of Physical Presence
Digital irrefutability rests on the multi-factor evidence:
1. **Something you did**: Logged the location.
2. **Somewhere you were**: GPS + IP verification.
3. **When you were there**: Cryptographic timestamps.

By combining these, we move from "simple logging" to "evidentiary proof" suitable for government body auditing.

## 5. Shortcut Integrity & Security
A common question is whether a user could "spoof" their location by editing the iOS Shortcut. While iOS Shortcuts are technically editable by the user, the Nomad Nights system maintains integrity through **Multi-Factor Auditing**:

- **External Validation (IP Addresses)**: The server captures the `client_ip` of the request. Spoofing a GPS coordinate in a shortcut is easy; spoofing a residential IP address from a different country is significantly harder. Discrepancies between GPS and IP are flagged in the audit trail.
- **Immutable Audit Trail**: Because every modification to a log creates a new, timestamped entry in the `audit_trail`, an auditor can see if data was retrospectively modified or if it was logged "in the moment."
- **Server-Signed Manifests**: The final proof is the signed JSON. Even if a log was manual, the *declaration* is signed by the server, and the auditor can then use the forensic metadata (IP/Timestamp) to decide on its validity.
