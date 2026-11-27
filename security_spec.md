# Security Specification — اخدم دارك dz darkom pro (v2)

## 1. Data Invariants
1. **PII Isolation**: Public collections (`/projects`, `/artisans`, `/requests`) contain NO personal phone numbers, emails, or home addresses. Direct contact info (`contactInfo`) is strictly isolated inside `/inquiries/{inquiryId}`, readable ONLY by the sender (`senderId`), recipient (`recipientOwnerId`), or admin (`nassimarif255@gmail.com`).
2. **Verified Creator Ownership**: All writes require `request.auth != null && request.auth.token.email_verified == true` and `ownerId == request.auth.uid` (or `senderId == request.auth.uid` for inquiries).
3. **Master Gate on Subcollections**: `/projects/{id}/photos/{pid}`, `/artisans/{id}/photos/{pid}`, and `/requests/{id}/photos/{pid}` verify via `exists()` and `get()` that the parent document exists and is owned by `request.auth.uid` (or caller is admin).
4. **Terminal State Locking**:
   - In `/requests/{requestId}`, once `status == 'closed'`, non-admin updates are blocked.
   - In `/inquiries/{inquiryId}`, once `status == 'replied'`, non-admin updates are blocked; only the recipient can transition `'pending' -> 'replied'` and only update `replyText`, `status`, and `updatedAt`.
5. **Strict Volumetric & Schema Bounds**: Every write validates `keys().hasAll(...) && keys().hasOnly(...)`, string lengths, enum allowlists, ID regex `^[a-zA-Z0-9_\-]+$`, and `request.time` server timestamps.

## 2. Dirty Dozen Payloads (Must Return PERMISSION_DENIED)
1. Reading `/inquiries` as an unauthenticated user or third party who is neither `senderId` nor `recipientOwnerId`.
2. Creating an `/artisans` doc with `ownerId` belonging to another user.
3. Injecting a shadow field (`isVerified: true` or `phone: "0550..."`) into `/artisans` or `/requests`.
4. Updating a `/requests` doc after `status == 'closed'` by a non-admin.
5. Sending an `/inquiries` message where `senderId == recipientOwnerId` (self-inquiry spam) or `status: 'replied'` on creation.
6. Modifying `message` or `senderId` on `/inquiries` during a reply update.
7. Attaching an orphan photo to `/artisans/missing/photos/p1` or `/requests/missing/photos/p1`.
8. Uploading an oversized image URI (> 450,000 chars) or non-image `javascript:` URI.
9. Unverified email user attempting to create a service request or artisan profile.
10. Setting `experienceYears` to a negative number or > 80 on `/artisans`.
11. Altering `createdAt` or `ownerId` on update.
12. Deleting another user's request, artisan profile, or project.
