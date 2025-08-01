/**
 * Revolutionary Inventory System - Audit Trails Module
 * Comprehensive audit logging and compliance tracking
 */

const logger = require('../../utils/logger');

class AuditService {
    constructor() {
        this.auditLogs = [];
        this.retentionPeriod = 7 * 365 * 24 * 60 * 60 * 1000; // 7 years in milliseconds
    }

    async logEvent(eventData) {
        const auditEntry = {
            id: this.generateAuditId(),
            timestamp: new Date().toISOString(),
            facilityId: eventData.facilityId,
            userId: eventData.userId || 'system',
            userRole: eventData.userRole || 'unknown',
            eventType: eventData.eventType,
            entityType: eventData.entityType,
            entityId: eventData.entityId,
            action: eventData.action,
            oldValues: eventData.oldValues || null,
            newValues: eventData.newValues || null,
            metadata: {
                ipAddress: eventData.ipAddress,
                userAgent: eventData.userAgent,
                sessionId: eventData.sessionId,
                requestId: eventData.requestId
            },
            complianceFlags: eventData.complianceFlags || [],
            severity: eventData.severity || 'info'
        };

        this.auditLogs.push(auditEntry);

        // Log to system logger as well
        logger.info('Audit event logged', {
            auditId: auditEntry.id,
            eventType: auditEntry.eventType,
            action: auditEntry.action,
            facilityId: auditEntry.facilityId,
            userId: auditEntry.userId
        });

        return auditEntry.id;
    }

    async getAuditTrail(facilityId, filters = {}) {
        let results = this.auditLogs.filter(log => log.facilityId === facilityId);

        // Apply filters
        if (filters.userId) {
            results = results.filter(log => log.userId === filters.userId);
        }

        if (filters.eventType) {
            results = results.filter(log => log.eventType === filters.eventType);
        }

        if (filters.entityType) {
            results = results.filter(log => log.entityType === filters.entityType);
        }

        if (filters.startDate) {
            results = results.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
        }

        if (filters.endDate) {
            results = results.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
        }

        if (filters.severity) {
            results = results.filter(log => log.severity === filters.severity);
        }

        // Sort by timestamp (newest first)
        results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Apply pagination
        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 50;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        return {
            logs: results.slice(startIndex, endIndex),
            pagination: {
                page,
                limit,
                total: results.length,
                totalPages: Math.ceil(results.length / limit)
            }
        };
    }

    async getComplianceReport(facilityId, standard) {
        const logs = this.auditLogs.filter(log => 
            log.facilityId === facilityId && 
            log.complianceFlags.includes(standard)
        );

        const report = {
            standard,
            facilityId,
            generatedAt: new Date().toISOString(),
            period: {
                start: logs.length > 0 ? logs[logs.length - 1].timestamp : null,
                end: logs.length > 0 ? logs[0].timestamp : null
            },
            summary: {
                totalEvents: logs.length,
                eventsByType: this.groupBy(logs, 'eventType'),
                eventsBySeverity: this.groupBy(logs, 'severity'),
                uniqueUsers: [...new Set(logs.map(log => log.userId))].length
            },
            compliance: {
                status: 'Compliant',
                lastAudit: new Date().toISOString(),
                nextAudit: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                issues: []
            }
        };

        return report;
    }

    generateAuditId() {
        return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const value = item[key];
            groups[value] = (groups[value] || 0) + 1;
            return groups;
        }, {});
    }

    // Compliance event loggers
    async logProductAccess(facilityId, userId, productId, action, metadata = {}) {
        return this.logEvent({
            facilityId,
            userId,
            eventType: 'product_access',
            entityType: 'product',
            entityId: productId,
            action,
            complianceFlags: ['sox', 'gdpr', 'financial'],
            severity: 'info',
            ...metadata
        });
    }

    async logInventoryChange(facilityId, userId, productId, oldValues, newValues, metadata = {}) {
        return this.logEvent({
            facilityId,
            userId,
            eventType: 'inventory_change',
            entityType: 'product',
            entityId: productId,
            action: 'update',
            oldValues,
            newValues,
            complianceFlags: ['sox', 'financial', 'inventory'],
            severity: 'info',
            ...metadata
        });
    }

    async logFinancialTransaction(facilityId, userId, transactionId, details, metadata = {}) {
        return this.logEvent({
            facilityId,
            userId,
            eventType: 'financial_transaction',
            entityType: 'transaction',
            entityId: transactionId,
            action: 'create',
            newValues: details,
            complianceFlags: ['sox', 'financial', 'aml'],
            severity: 'high',
            ...metadata
        });
    }

    async logSecurityEvent(facilityId, userId, eventDetails, metadata = {}) {
        return this.logEvent({
            facilityId,
            userId,
            eventType: 'security_event',
            entityType: 'security',
            entityId: eventDetails.incidentId,
            action: eventDetails.action,
            newValues: eventDetails,
            complianceFlags: ['security', 'gdpr', 'hipaa'],
            severity: eventDetails.severity || 'medium',
            ...metadata
        });
    }

    async logDataAccess(facilityId, userId, dataType, action, metadata = {}) {
        return this.logEvent({
            facilityId,
            userId,
            eventType: 'data_access',
            entityType: 'data',
            entityId: dataType,
            action,
            complianceFlags: ['gdpr', 'hipaa', 'privacy'],
            severity: 'info',
            ...metadata
        });
    }
}

module.exports = AuditService;
