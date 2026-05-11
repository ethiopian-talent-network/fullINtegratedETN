-- Add missing columns to existing tables

-- Check if is_verified column exists in employers table, if not add it
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'ETN_DB' 
     AND TABLE_NAME = 'employers' 
     AND COLUMN_NAME = 'is_verified') = 0,
    'ALTER TABLE employers ADD COLUMN is_verified TINYINT(1) DEFAULT 0',
    'SELECT "Column is_verified already exists in employers table"'
));

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if reviewed_by column exists in employer_licenses table, if not add it
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'ETN_DB' 
     AND TABLE_NAME = 'employer_licenses' 
     AND COLUMN_NAME = 'reviewed_by') = 0,
    'ALTER TABLE employer_licenses ADD COLUMN reviewed_by INT NULL',
    'SELECT "Column reviewed_by already exists in employer_licenses table"'
));

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;