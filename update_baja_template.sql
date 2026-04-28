-- Actualizar la plantilla de baja con un motivo profesional y conciso
-- ya que ahora el sistema la envuelve en un HTML premium de Pata Amiga.

UPDATE communication_templates 
SET content = 'Incumplimiento de las políticas de convivencia y bienestar animal de Club Pata Amiga.'
WHERE name = 'Aviso de Baja por Incumplimiento';
