/**
 * Revolutionary Inventory System - Audit Module
 * Comprehensive audit logging and compliance tracking
 */

const AuditService = require('./AuditService');

module.exports = {
    AuditService,
    moduleInfo: {
        name: 'audit',
        version: '1.0.0',
        description: 'Comprehensive audit logging and compliance tracking',
        features: [
            'Comprehensive event logging',
            'Compliance reporting (SOX, GDPR, HIPAA)',
            'Audit trail management',
            'Data access tracking',
            'Financial transaction auditing',
            'Security event monitoring',
            'Export capabilities'
        ]
    }
};
