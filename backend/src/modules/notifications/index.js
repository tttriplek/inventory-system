/**
 * Revolutionary Inventory System - Notifications Module
 * Smart notification management with multi-channel delivery
 */

const NotificationService = require('./NotificationService');

module.exports = {
    NotificationService,
    moduleInfo: {
        name: 'notifications',
        version: '1.0.0',
        description: 'Smart notification management with multi-channel delivery',
        features: [
            'Multi-channel notifications (Email, SMS, Slack, Webhooks)',
            'Template-based messaging',
            'Rule-based automatic alerts',
            'Escalation policies',
            'Delivery tracking and analytics',
            'Priority-based processing'
        ]
    }
};
