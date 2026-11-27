# Security Specification — اخدم دارك dz darkom pro

## 1. Data Invariants
1. **Public Showcase Readability**: Published works in `/projects/{projectId}` and their gallery photos in `/projects/{projectId}/photos/{photoId}` are intentionally public (`get` and `list` allowed without PII exposure; no emails, phones, or private credentials are stored in `/projects`).
2. **Verified Creator Ownership**: Only signed-in users with `request.auth.token.email_verified == true` can create a project, and `incoming().ownerId` must strictly equal `request.auth.uid`.
3. **Immutable Ownership & Creation Time**: `ownerId` and `createdAt` can never be altered on update.
4. **Master Gate on Photo Subcollections**: Creating or deleting a photo under `/projects/{projectId}/photos/{photoId}` verifies via `get()` that the parent `/projects/{projectId}` document exists and is owned by `request.auth.uid` (or the caller is an admin).
5. **Strict Schema & Volumetric Bounds**: Shadow fields are rejected (`hasOnly()`), string sizes are bounded (`coverImage <= 450000`, `title <= 120`, `description <= 1500`), and timestamps must equal `request.time`.
6. **Bootstrapped Admin**: `nassimarif255@gmail.com` (with `email_verified == true`) or a doc in `/admins/{uid}` grants admin moderation privileges.

## 2. Dirty Dozen Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Create**: `{ "title": "Hack" }` without auth -> DENIED.
2. **Unverified Email Create**: Auth token has `email_verified: false` -> DENIED.
3. **Identity Spoofing on Create**: `ownerId: "victim-uid"` when `request.auth.uid == "attacker-uid"` -> DENIED.
4. **Shadow Field Injection**: Valid project + `"isFeatured": true` or `"isAdmin": true` -> DENIED.
5. **Client Timestamp Forgery**: `createdAt` set to past/future client timestamp instead of `request.time` -> DENIED.
6. **Oversized Cover Image (Denial of Wallet)**: `coverImage` string length > 450,000 chars -> DENIED.
7. **Invalid Category Enum**: `category: "arbitrary_hacking"` -> DENIED.
8. **ID Poisoning**: Document ID `{projectId}` > 128 chars or containing invalid symbols `../` -> DENIED.
9. **Unauthorized Update by Non-Owner**: User B tries to update User A's project -> DENIED.
10. **OwnerId Hijack on Update**: Owner tries to change `ownerId` or `createdAt` -> DENIED.
11. **Orphan Photo Subcollection Write**: Creating `/projects/nonexistent/photos/p1` -> DENIED by Master Gate `exists()`/`get()`.
12. **Subcollection Cross-Owner Photo Injection**: User B tries to add a photo to User A's project -> DENIED by parent `get()` owner check.
