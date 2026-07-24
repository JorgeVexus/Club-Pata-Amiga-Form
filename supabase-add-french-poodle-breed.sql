-- Agrega la raza "French poodle" al catalogo de razas para autocompletado.
-- La API publica /api/breeds consulta esta tabla directamente.

INSERT INTO breeds (name, type, has_genetic_issues, warning_message, max_age, size)
VALUES ('French poodle', 'perro', false, null, 9, 'Pequeño')
ON CONFLICT (name, type) DO UPDATE SET
    has_genetic_issues = EXCLUDED.has_genetic_issues,
    warning_message = EXCLUDED.warning_message,
    max_age = EXCLUDED.max_age,
    size = EXCLUDED.size;
