# Haseeb School — Management System

A working Admin website built from your flowchart: 3D logo splash → Admin login →
Dashboard → 8 modules (New Student, Edit Student, Fee Slip/Status, Pay Fee,
Search Student, Change Section/Promotion, Class Management, Result Management),
Defaulter List, and Database Backup (automatic weekly + manual). Includes
1-minute auto-lock and single active login session, as in the flowchart's Detail B.

Firebase (Firestore + Authentication) is already wired in using the config you
provided. Before it works live, do these **one-time setup steps** in the
Firebase Console for project `haseebschool-5a53d`:

## 1. Enable Email/Password sign-in
Authentication → Sign-in method → enable **Email/Password**.

## 2. Create the admin account
Authentication → Users → **Add user** → enter the email + password you want to
use as the Admin login on the site (this is the "Username & Password" from the
flowchart).

## 3. Create the Firestore database
Firestore Database → **Create database** → Production mode → pick a region
close to Pakistan (e.g. `asia-south1`).

## 4. Set Firestore security rules
Firestore Database → Rules → replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

This means only a signed-in admin can read or write data — matches "Admin-only,
no student/parent login" from the flowchart.

## 5. Authorize your live domain
Once deployed to GitHub Pages (see below), go to Authentication → Settings →
Authorized domains → **Add domain** → add your `*.github.io` address, e.g.
`yourusername.github.io`.

---

## Deploying to GitHub Pages (for the client to view)

1. Create a new **public** repository on GitHub, e.g. `haseeb-school-website`.
2. Upload all files from this folder (`index.html`, all other `.html` files,
   the `css/` folder, and the `js/` folder) to the repository — keep the same
   folder structure.
3. In the repo, go to **Settings → Pages**.
4. Under "Build and deployment", set **Source: Deploy from a branch**, branch
   `main`, folder `/ (root)`.
5. Save. After a minute, the live link appears at the top of that page —
   usually `https://yourusername.github.io/haseeb-school-website/`.
6. Don't forget step 5 above (Authorize your live domain) or login will fail
   on the live link with an `auth/unauthorized-domain` error.

Send that link to your client — every page works exactly as it will for real
use, with live data in Firestore.

## Notes
- Fee status logic: a student is "pending" if this month's fee hasn't been
  recorded yet, or the one-time admission fee hasn't been paid.
- The Defaulter List and Fee Slip/Status pages both read live from the same
  Firestore data, just like the flowchart's "Both lists read live from the
  Central Database" note.
- Backup downloads a `.json` file with all students, classes, fee payments,
  and results — open it any time to restore or inspect data manually.
