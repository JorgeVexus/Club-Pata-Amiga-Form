# Plan de Implementación: Mensajes de Carencia Dinámicos

Este plan detalla la implementación de mensajes explicativos y personalizados para el periodo de carencia (espera) en los widgets de la plataforma.

## Objetivo
Mostrar un texto detallado que explique POR QUÉ una mascota tiene cierto periodo de espera, basado en sus características reales (especie, adopción, raza/mestizo y código de embajador).

## Usuario Review Requerido
> [!IMPORTANT]
> El mensaje seguirá este formato:
> "Recuerda que **[Nombre]** tiene un periodo de espera de **[X] días** debido a que es una **[Especie] [Adoptado o no]**, **[De raza o mestizo]** registrado con código de embajador (si aplica)."

## Cambios Propuestos

### Componente: Lógica de Mensajería (Helper)
Se implementará una función `getCarenciaExplanation(pet)` que construya el mensaje dinámicamente.

```javascript
getCarenciaExplanation(pet) {
    const isTrue = (val) => val === true || val === 'true' || val === 1 || val === '1';
    const isAdopted = isTrue(pet.is_adopted) || isTrue(pet['is-adopted']) || isTrue(pet.isAdopted);
    const isMixed = isTrue(pet.is_mixed_breed) || isTrue(pet['is-mixed-breed']) || isTrue(pet.is_mixed) || isTrue(pet.isMixed);
    
    // El código de embajador puede estar en la mascota o en el perfil del usuario (msFields)
    const hasAmbassadorCode = !!(pet.referral_code || (this.msFields && (this.msFields['referral-code'] || this.msFields['ambassador-code'])));
    
    const carencia = this.calculateCarencia(pet);
    const name = pet.name;
    const totalDays = carencia.totalDays;
    
    const species = (pet.pet_type || pet.type || '').toLowerCase().includes('gato') ? 'michi' : 'lomito';
    const adoptedText = isAdopted ? 'adoptado' : 'no adoptado';
    const breedText = isMixed ? (species === 'michi' ? 'doméstico' : 'mestizo') : 'de raza';
    const ambassadorText = hasAmbassadorCode ? ' registrado con código de embajador' : '';

    return `Recuerda que ${name} tiene un periodo de espera de ${totalDays} días debido a que es una ${species} ${adoptedText}, ${breedText}${ambassadorText}.`;
}
```

### [MODIFY] [unified-membership-widget.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/unified-membership-widget.js)
- Agregar la función `getCarenciaExplanation` a la clase `UnifiedWidget`.
- Inyectar el mensaje en `renderApprovedContent` debajo del badge de "tu periodo de espera".
- Inyectar el mensaje en `renderPetDetailsModal` encima de la barra de progreso.

### [MODIFY] [pet-cards-widget.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/pet-cards-widget.js)
- Agregar la función `getCarenciaExplanation` a la clase `ManadaWidget`.
- Inyectar el mensaje en `showDetails` encima de la barra de progreso dentro del modal de detalles.

### [MODIFY] [user-profile-widget.js](file:///c:/Users/Jorge%20Cerna/OneDrive/Desktop/new%20project/pet-membership-form/public/widgets/user-profile-widget.js)
- Verificar que el estilo de los mensajes inyectados por `pet-cards-widget.js` sea consistente con el diseño premium neo-brutalista de este widget.

## Plan de Verificación

### Pruebas Manuales
1. Entrar con un usuario que tenga mascotas en carencia.
2. Verificar que en el Dashboard Unificado aparezca el texto explicativo correcto para cada mascota.
3. Abrir el modal de detalles de una mascota y verificar el texto sobre la barra de progreso.
4. Abrir el widget de "Mi Manada" (Pet Cards) y verificar que el modal de detalles también muestre el mensaje.
5. Probar con diferentes combinaciones:
    - Lomito Adoptado + Mestizo + Código Embajador.
    - Michi No Adoptado + De Raza.
    - Lomito Adoptado + De Raza.
