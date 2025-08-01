/**
 * Revolutionary Inventory System - Notification Routes
 * API endpoints for managing smart notifications
 */

const express = require('express');
const NotificationService = require('./NotificationService');
const logger = require('../../utils/logger');

const router = express.Router();
const notificationService = new NotificationService();

/**
 * @route   POST /api/notifications/send
 * @desc    Send a notification
 * @access  Private
 */
router.post('/send', async (req, res) => {
    try {
        const { type, data, recipients, options } = req.body;

        if (!type || !data || !recipients) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: type, data, recipients'
            });
        }

        const notificationId = await notificationService.sendNotification(
            type,
            data,
            recipients,
            options
        );

        res.json({
            success: true,
            data: {
                notificationId,
                message: 'Notification queued successfully'
            }
        });

    } catch (error) {
        logger.error('Failed to send notification', {
            error: error.message,
            body: req.body
        });

        res.status(500).json({
            success: false,
            message: 'Failed to send notification',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/notifications/alert/:type
 * @desc    Send specific alert types with predefined templates
 * @access  Private
 */
router.post('/alert/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const { facilityId, data, recipients } = req.body;

        // Validate alert type
        const validTypes = ['inventory', 'financial', 'security', 'critical'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: `Invalid alert type. Must be one of: ${validTypes.join(', ')}`
            });
        }

        const alertData = {
            ...data,
            facilityId,
            timestamp: new Date().toISOString(),
            alertType: type
        };

        const notificationId = await notificationService.sendNotification(
            `${type}-alert`,
            alertData,
            recipients,
            { priority: type === 'critical' ? 'critical' : 'high' }
        );

        res.json({
            success: true,
            data: {
                notificationId,
                alertType: type,
                message: `${type} alert sent successfully`
            }
        });

    } catch (error) {
        logger.error('Failed to send alert', {
            type: req.params.type,
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to send alert',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/notifications/evaluate
 * @desc    Evaluate notification rules against event data
 * @access  Private
 */
router.post('/evaluate', async (req, res) => {
    try {
        const { eventType, data } = req.body;

        if (!eventType || !data) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: eventType, data'
            });
        }

        await notificationService.evaluateRules(eventType, data);

        res.json({
            success: true,
            data: {
                message: 'Rules evaluated successfully',
                eventType
            }
        });

    } catch (error) {
        logger.error('Failed to evaluate notification rules', {
            eventType: req.body.eventType,
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to evaluate notification rules',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/notifications/templates
 * @desc    Get available notification templates
 * @access  Private
 */
router.get('/templates', (req, res) => {
    try {
        const templates = Array.from(notificationService.templates.entries()).map(([key, template]) => ({
            id: key,
            name: template.name,
            channels: template.channels,
            description: `Template for ${template.name.toLowerCase()}`
        }));

        res.json({
            success: true,
            data: {
                templates,
                count: templates.length
            }
        });

    } catch (error) {
        logger.error('Failed to get notification templates', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to get notification templates',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/notifications/channels
 * @desc    Get available notification channels and their status
 * @access  Private
 */
router.get('/channels', (req, res) => {
    try {
        const channels = Array.from(notificationService.channels.entries()).map(([key, channel]) => ({
            id: key,
            type: channel.type,
            enabled: channel.enabled,
            configured: Boolean(channel.config)
        }));

        res.json({
            success: true,
            data: {
                channels,
                count: channels.length
            }
        });

    } catch (error) {
        logger.error('Failed to get notification channels', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to get notification channels',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/notifications/stats
 * @desc    Get notification statistics
 * @access  Private
 */
router.get('/stats', (req, res) => {
    try {
        const { timeframe = '24h' } = req.query;
        const stats = notificationService.getNotificationStats(timeframe);

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        logger.error('Failed to get notification stats', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to get notification stats',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/notifications/settings/:facilityId
 * @desc    Update notification settings for a facility
 * @access  Private
 */
router.put('/settings/:facilityId', (req, res) => {
    try {
        const { facilityId } = req.params;
        const settings = req.body;

        notificationService.updateNotificationSettings(facilityId, settings);

        res.json({
            success: true,
            data: {
                facilityId,
                message: 'Notification settings updated successfully'
            }
        });

    } catch (error) {
        logger.error('Failed to update notification settings', {
            facilityId: req.params.facilityId,
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to update notification settings',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/notifications/test
 * @desc    Send a test notification
 * @access  Private
 */
router.post('/test', async (req, res) => {
    try {
        const { channel, recipient } = req.body;

        const testData = {
            title: 'Test Notification',
            description: 'This is a test notification from the Revolutionary Inventory System',
            facilityName: 'Test Facility',
            timestamp: new Date().toISOString(),
            severity: 'info'
        };

        const notificationId = await notificationService.sendNotification(
            'critical-alert',
            testData,
            [recipient],
            { 
                channels: channel ? [channel] : ['email'],
                priority: 'low'
            }
        );

        res.json({
            success: true,
            data: {
                notificationId,
                message: 'Test notification sent successfully'
            }
        });

    } catch (error) {
        logger.error('Failed to send test notification', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to send test notification',
            error: error.message
        });
    }
});

module.exports = router;
