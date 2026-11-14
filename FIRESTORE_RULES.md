# Publishing the Firestore rules (do this LAST)

The passphrase is optional. `firestore.rules` follows the account:

- Account with a passphrase (`e2ee` on its user document): only end-to-end encrypted
  documents (`enc` map) are accepted.
- Account without one: readable documents are accepted.
- Removing a passphrase: the app sets `e2eeDisabling` on the user document, rewrites the
  data readable, then removes `e2ee`. The rules allow that removal only while the flag is set.

Each write to a data collection reads the user document once to check this (one extra
Firestore read per write).

Order:
1. Deploy the new web build (push to GitHub -> Vercel). Add `GEMINI_API_KEY` in Vercel env vars.
2. Install the new Android build (it opens accounts without a passphrase directly;
   an older build will still ask every account to create one).
3. Remove the old server reminder function: `firebase functions:delete sendReminders`
4. Publish the rules: `firebase deploy --only firestore:rules`

If the previous (encryption-required) rules are already live, publish these rules together
with the web build: under the old rules an account without a passphrase cannot save anything.

With a passphrase: lose both passphrase and recovery key = data cannot be recovered by anyone.
