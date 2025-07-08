-- Migration to add opening hours enhancements
-- Adds support for single time mode and split time mode with timeMode field

-- First, let's check if we need to update the tenant_settings table structure
-- The opening hours are stored as JSON in the settings_json field, so no schema changes needed

-- However, we need to ensure default values are set for existing tenants
-- This script will update existing tenant settings to include the new timeMode field

UPDATE tenant_settings 
SET settings_json = JSON_SET(
    settings_json,
    '$.openingHours.monday.timeMode', 'split',
    '$.openingHours.tuesday.timeMode', 'split',
    '$.openingHours.wednesday.timeMode', 'split',
    '$.openingHours.thursday.timeMode', 'split',
    '$.openingHours.friday.timeMode', 'split',
    '$.openingHours.saturday.timeMode', 'split',
    '$.openingHours.sunday.timeMode', 'split'
)
WHERE JSON_EXTRACT(settings_json, '$.openingHours.monday.timeMode') IS NULL;

-- Ensure orderTypeSettings exist for all tenants
UPDATE tenant_settings 
SET settings_json = JSON_SET(
    settings_json,
    '$.orderTypeSettings.deliveryEnabled', true,
    '$.orderTypeSettings.collectionEnabled', true,
    '$.orderTypeSettings.advanceOrderEnabled', true
)
WHERE JSON_EXTRACT(settings_json, '$.orderTypeSettings') IS NULL;

-- Set default timeMode for any existing opening hours that don't have it
UPDATE tenant_settings 
SET settings_json = JSON_SET(
    settings_json,
    '$.openingHours.monday.timeMode', COALESCE(JSON_EXTRACT(settings_json, '$.openingHours.monday.timeMode'), 'split'),
    '$.openingHours.tuesday.timeMode', COALESCE(JSON_EXTRACT(settings_json, '$.openingHours.tuesday.timeMode'), 'split'),
    '$.openingHours.wednesday.timeMode', COALESCE(JSON_EXTRACT(settings_json, '$.openingHours.wednesday.timeMode'), 'split'),
    '$.openingHours.thursday.timeMode', COALESCE(JSON_EXTRACT(settings_json, '$.openingHours.thursday.timeMode'), 'split'),
    '$.openingHours.friday.timeMode', COALESCE(JSON_EXTRACT(settings_json, '$.openingHours.friday.timeMode'), 'split'),
    '$.openingHours.saturday.timeMode', COALESCE(JSON_EXTRACT(settings_json, '$.openingHours.saturday.timeMode'), 'split'),
    '$.openingHours.sunday.timeMode', COALESCE(JSON_EXTRACT(settings_json, '$.openingHours.sunday.timeMode'), 'split')
);

-- Add default closed status for days that might not have it
UPDATE tenant_settings 
SET settings_json = JSON_SET(
    settings_json,
    '$.openingHours.monday.closed', COALESCE(JSON_EXTRACT(settings_json, '$.openingHours.monday.closed'), false),
    '$.openingHours.tuesday.closed', COALESCE(JSON_EXTRACT(settings_json, '$.openingHours.tuesday.closed'), false),
    '$.openingHours.wednesday.closed', COALESCE(JSON_EXTRACT(settings_json, '$.openingHours.wednesday.closed'), false),
    '$.openingHours.thursday.closed', COALESCE(JSON_EXTRACT(settings_json, '$.openingHours.thursday.closed'), false),
    '$.openingHours.friday.closed', COALESCE(JSON_EXTRACT(settings_json, '$.openingHours.friday.closed'), false),
    '$.openingHours.saturday.closed', COALESCE(JSON_EXTRACT(settings_json, '$.openingHours.saturday.closed'), false),
    '$.openingHours.sunday.closed', COALESCE(JSON_EXTRACT(settings_json, '$.openingHours.sunday.closed'), false)
);
