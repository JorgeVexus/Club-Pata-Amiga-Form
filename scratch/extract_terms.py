
import os

source_path = r'c:\Users\Jorge Cerna\OneDrive\Desktop\new project\pet-membership-form\Documentacion\terminos_limpios.md'
output_path = r'c:\Users\Jorge Cerna\OneDrive\Desktop\new project\pet-membership-form\src\data\legal-terms.ts'

if not os.path.exists(source_path):
    print(f"Error: {source_path} not found")
    exit(1)

with open(source_path, 'r', encoding='utf-8') as f:
    full_content = f.read()

# Escaping backticks and ${ for JS template literal
escaped_content = full_content.replace('`', '\\`').replace('${', '\\${')

with open(output_path, 'w', encoding='utf-8') as f:
    f.write('export const LEGAL_CONTENT = {\n')
    f.write('    terms: `')
    f.write(escaped_content)
    f.write('`,\n')
    f.write('    privacy: `AVISO DE PRIVACIDAD INTEGRAL\n\n(Consultar términos generales registrados en la sección de Términos y Condiciones integrales).`,\n')
    f.write('    fullDocument: `')
    f.write(escaped_content)
    f.write('`\n')
    f.write('};\n')

print(f"Successfully updated {output_path}")
