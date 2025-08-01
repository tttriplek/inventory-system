/**
 * Revolutionary Inventory System - Audit Routes
 * API endpoints for audit trails and compliance reporting
 */

const express = require('express');
const AuditService = require('./AuditService');
const logger = require('../../utils/logger');
const { checkFeature } = require('../features/featureChecker');

const router = express.Router();
const auditService = new AuditService();

/**
 * @route   GET /api/audit/trail/:facilityId
 * @desc    Get audit trail for a facility
 * @access  Private
 */
router.get('/trail/:facilityId', checkFeature('audit-trails'), async (req, res) => {
    try {
        const { facilityId } = req.params;
        const filters = {
            userId: req.query.userId,
            eventType: req.query.eventType,
            entityType: req.query.entityType,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            severity: req.query.severity,
            page: req.query.page,
            limit: req.query.limit
        };

        // Remove undefined values
        Object.keys(filters).forEach(key => 
            filters[key] === undefined && delete filters[key]
        );

        const auditData = await auditService.getAuditTrail(facilityId, filters);

        res.json({
            success: true,
            data: auditData
        });

    } catch (error) {
        logger.error('Failed to get audit trail', {
            facilityId: req.params.facilityId,
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to get audit trail',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/audit/log
 * @desc    Log an audit event
 * @access  Private
 */
router.post('/log', checkFeature('audit-trails'), async (req, res) => {
    try {
        const eventData = {
            ...req.body,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            sessionId: req.sessionID,
            requestId: req.id
        };

        const auditId = await auditService.logEvent(eventData);

        res.json({
            success: true,
            data: {
                auditId,
                message: 'Event logged successfully'
            }
        });

    } catch (error) {
        logger.error('Failed to log audit event', {
            error: error.message,
            body: req.body
        });

        res.status(500).json({
            success: false,
            message: 'Failed to log audit event',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/audit/compliance/:facilityId/:standard
 * @desc    Get compliance report for a specific standard
 * @access  Private
 */
router.get('/compliance/:facilityId/:standard', checkFeature('audit-trails'), async (req, res) => {
    try {
        const { facilityId, standard } = req.params;

        const validStandards = ['sox', 'gdpr', 'hipaa', 'financial', 'security', 'inventory'];
        if (!validStandards.includes(standard.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: `Invalid compliance standard. Must be one of: ${validStandards.join(', ')}`
            });
        }

        const report = await auditService.getComplianceReport(facilityId, standard.toLowerCase());

        res.json({
            success: true,
            data: report
        });

    } catch (error) {
        logger.error('Failed to get compliance report', {
            facilityId: req.params.facilityId,
            standard: req.params.standard,
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to get compliance report',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/audit/product-access
 * @desc    Log product access event
 * @access  Private
 */
router.post('/product-access', checkFeature('audit-trails'), async (req, res) => {
    try {
        const { facilityId, userId, productId, action } = req.body;

        if (!facilityId || !userId || !productId || !action) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: facilityId, userId, productId, action'
            });
        }

        const metadata = {
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            sessionId: req.sessionID
        };

        const auditId = await auditService.logProductAccess(
            facilityId, 
            userId, 
            productId, 
            action, 
            metadata
        );

        res.json({
            success: true,
            data: {
                auditId,
                message: 'Product access logged successfully'
            }
        });

    } catch (error) {
        logger.error('Failed to log product access', {
            error: error.message,
            body: req.body
        });

        res.status(500).json({
            success: false,
            message: 'Failed to log product access',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/audit/inventory-change
 * @desc    Log inventory change event
 * @access  Private
 */
router.post('/inventory-change', checkFeature('audit-trails'), async (req, res) => {
    try {
        const { facilityId, userId, productId, oldValues, newValues } = req.body;

        if (!facilityId || !userId || !productId || !oldValues || !newValues) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: facilityId, userId, productId, oldValues, newValues'
            });
        }

        const metadata = {
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            sessionId: req.sessionID
        };

        const auditId = await auditService.logInventoryChange(
            facilityId,
            userId,
            productId,
            oldValues,
            newValues,
            metadata
        );

        res.json({
            success: true,
            data: {
                auditId,
                message: 'Inventory change logged successfully'
            }
        });

    } catch (error) {
        logger.error('Failed to log inventory change', {
            error: error.message,
            body: req.body
        });

        res.status(500).json({
            success: false,
            message: 'Failed to log inventory change',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/audit/financial-transaction
 * @desc    Log financial transaction event
 * @access  Private
 */
router.post('/financial-transaction', checkFeature('audit-trails'), async (req, res) => {
    try {
        const { facilityId, userId, transactionId, details } = req.body;

        if (!facilityId || !userId || !transactionId || !details) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: facilityId, userId, transactionId, details'
            });
        }

        const metadata = {
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            sessionId: req.sessionID
        };

        const auditId = await auditService.logFinancialTransaction(
            facilityId,
            userId,
            transactionId,
            details,
            metadata
        );

        res.json({
            success: true,
            data: {
                auditId,
                message: 'Financial transaction logged successfully'
            }
        });

    } catch (error) {
        logger.error('Failed to log financial transaction', {
            error: error.message,
            body: req.body
        });

        res.status(500).json({
            success: false,
            message: 'Failed to log financial transaction',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/audit/export/:facilityId
 * @desc    Export audit logs in various formats
 * @access  Private
 */
router.get('/export/:facilityId', checkFeature('audit-trails'), async (req, res) => {
    try {
        const { facilityId } = req.params;
        const { format = 'json', startDate, endDate } = req.query;

        const filters = { startDate, endDate };
        Object.keys(filters).forEach(key => 
            filters[key] === undefined && delete filters[key]
        );

        const auditData = await auditService.getAuditTrail(facilityId, filters);

        // Set appropriate headers based on format
        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="audit-${facilityId}-${Date.now()}.csv"`);
            
            // Convert to CSV (simplified)
            const csvHeaders = 'Timestamp,User ID,Event Type,Action,Entity Type,Entity ID,Severity\n';
            const csvData = auditData.logs.map(log => 
                `${log.timestamp},${log.userId},${log.eventType},${log.action},${log.entityType},${log.entityId},${log.severity}`
            ).join('\n');
            
            res.send(csvHeaders + csvData);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="audit-${facilityId}-${Date.now()}.json"`);
            res.json(auditData);
        }

    } catch (error) {
        logger.error('Failed to export audit logs', {
            facilityId: req.params.facilityId,
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to export audit logs',
            error: error.message
        });
    }
});

module.exports = router;
