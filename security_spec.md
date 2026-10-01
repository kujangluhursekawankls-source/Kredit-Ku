# Security Specification - KreditKu Multi-Tenant Architecture

## 1. Data Invariants
1. **Tenant Isolation**: Every business entity (Customer, Loan, Installment, Payment, Setting, Notification, AuditLog) MUST carry a `tenantId` and `ownerId` corresponding to the authenticated user's assigned tenant and UID.
2. **No Cross-Tenant Read/Write**: User A cannot read, query, create, modify, or delete any record where `ownerId != request.auth.uid` or `tenantId != user.tenantId`.
3. **Immutability of Ownership**: `ownerId` and `tenantId` cannot be updated or altered once a document is created.
4. **Audit Log Immutability**: Audit logs are append-only; update and delete operations are strictly denied.
5. **Soft Delete Preservation**: Financial transaction records (Payments) cannot be deleted; cancellation must be recorded via VOID status.
6. **Path Hardening**: All document IDs must adhere to standard length constraints (<= 128 characters) and alphanumeric regex `^[a-zA-Z0-9_\-]+$`.

## 2. The Dirty Dozen Payloads
1. Cross-Tenant Customer Read: User A attempts to `get` Customer document created by User B. (DENIED)
2. Cross-Tenant Loan List Query: User A queries `/loans` without `tenantId == userATenantId`. (DENIED)
3. Owner ID Spoofing on Create: User A creates a Customer with `ownerId: "user_b_uid"`. (DENIED)
4. Tenant ID Tampering on Update: User A attempts to update existing Loan changing `tenantId: "tenant_b"`. (DENIED)
5. Shadow Field Injection: User A attempts to set an unapproved field `__isAdmin: true` on `/users/{uid}`. (DENIED)
6. Giant Payload ID Injection: Malicious user sends a 2MB string as `{customerId}`. (DENIED)
7. Blanket List Access: Unauthenticated or non-owner reads from `/payments`. (DENIED)
8. Audit Log Tampering: User attempts to `update` or `delete` an existing `/audit_logs/{logId}`. (DENIED)
9. Tenant Hijack: User A attempts to update `/tenants/{tenantB}` where `ownerUid != userA.uid`. (DENIED)
10. Payment Deletion Attack: User attempts to call `delete()` on `/payments/{paymentId}` instead of VOID. (DENIED)
11. Settings Overwrite: User A attempts to write to `/settings/{tenantB}`. (DENIED)
12. Unauthenticated Mutation: Non-authenticated client attempts write to any collection. (DENIED)
