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
