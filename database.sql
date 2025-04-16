-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS cybersecurity_threats;
USE cybersecurity_threats;

-- Crear tabla de países
CREATE TABLE IF NOT EXISTS countries (
    country_id INT PRIMARY KEY AUTO_INCREMENT,
    country_name VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8)
);

-- Crear tabla de industrias
CREATE TABLE IF NOT EXISTS industries (
    industry_id INT PRIMARY KEY AUTO_INCREMENT,
    industry_name VARCHAR(100) NOT NULL
);

-- Crear tabla de tipos de ataque
CREATE TABLE IF NOT EXISTS attack_types (
    attack_type_id INT PRIMARY KEY AUTO_INCREMENT,
    attack_type_name VARCHAR(100) NOT NULL
);

-- Crear tabla principal de amenazas
CREATE TABLE IF NOT EXISTS cyber_threats (
    threat_id INT PRIMARY KEY AUTO_INCREMENT,
    country_id INT,
    year INT NOT NULL,
    attack_type_id INT,
    industry_id INT,
    financial_loss DECIMAL(15, 2),
    affected_users INT,
    attack_source VARCHAR(100),
    vulnerability VARCHAR(200),
    defense VARCHAR(200),
    resolution_time INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (country_id) REFERENCES countries(country_id),
    FOREIGN KEY (attack_type_id) REFERENCES attack_types(attack_type_id),
    FOREIGN KEY (industry_id) REFERENCES industries(industry_id)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_year ON cyber_threats(year);
CREATE INDEX idx_financial_loss ON cyber_threats(financial_loss);
CREATE INDEX idx_affected_users ON cyber_threats(affected_users);

-- Crear vistas para análisis comunes
CREATE VIEW yearly_statistics AS
SELECT 
    year,
    COUNT(*) as total_attacks,
    SUM(financial_loss) as total_losses,
    SUM(affected_users) as total_affected_users
FROM cyber_threats
GROUP BY year;

CREATE VIEW country_statistics AS
SELECT 
    c.country_name,
    COUNT(*) as total_attacks,
    SUM(ct.financial_loss) as total_losses,
    SUM(ct.affected_users) as total_affected_users
FROM cyber_threats ct
JOIN countries c ON ct.country_id = c.country_id
GROUP BY c.country_name;

CREATE VIEW industry_statistics AS
SELECT 
    i.industry_name,
    COUNT(*) as total_attacks,
    SUM(ct.financial_loss) as total_losses,
    AVG(ct.resolution_time) as avg_resolution_time
FROM cyber_threats ct
JOIN industries i ON ct.industry_id = i.industry_id
GROUP BY i.industry_name;