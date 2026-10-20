import { AuditLog } from '../models/index.js';

export async function logAudit({ userId, action, entity, entityId, details = {}, req = null }) {
  try {
    const ipAddress = req ? req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '' : '';
    const userAgent = req ? req.headers['user-agent'] || '' : '';

    await AuditLog.create({
      user: userId || null,
      action,
      entity,
      entityId: entityId ? String(entityId) : '',
      details,
      ipAddress,
      userAgent
    });
  } catch (error) {
    // Non-blocking error handling for audit logging
    console.error('[AuditLog] Failed to record audit log:', error.message);
  }
}
