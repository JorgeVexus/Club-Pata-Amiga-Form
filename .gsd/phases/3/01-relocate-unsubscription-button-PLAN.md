---
phase: 3
plan: 1
type: autonomous
wave: 1
---

# Plan 3.1: Relocate Pet Unsubscription Button

<objective>
Move the "Solicitar baja" button from the bottom of the modal to a more visible location at the top of the information section, ensuring users can see it without scrolling.

Purpose: Improve accessibility of the unsubscription feature.
Output: Updated `pet-cards-widget.js` with relocated UI elements.
</objective>

<context>
Load for context:
- `public/widgets/pet-cards-widget.js`
</context>

<tasks>

<task type="auto">
  <name>Relocate unsubscription UI in widget</name>
  <files>public/widgets/pet-cards-widget.js</files>
  <action>
    1. Remove the unsubscription button block from the end of the `showDetails` template (around lines 1226-1239).
    2. Insert a more compact version of the unsubscription UI immediately after the `pata-badge-row` div (around line 1076).
    3. Style the new button as a small red outlined action to maintain visual hierarchy while ensuring visibility.
    AVOID: Moving it into the left gallery section as it might overlap with upload controls.
  </action>
  <verify>Check the `showDetails` function in `pet-cards-widget.js` to ensure the button is moved after the badges.</verify>
  <done>Button is relocated after the badge row and removed from the bottom.</done>
</task>

<task type="checkpoint:human-verify">
  <name>Verify button visibility</name>
  <files>public/widgets/pet-cards-widget.js</files>
  <action>Open a pet's details modal in the dashboard and verify the "Solicitar baja" button is visible at the top without scrolling.</action>
  <verify>Visual confirmation.</verify>
  <done>Button is visible and functional in the new location.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] "Solicitar baja" button is located near the top of the modal.
- [ ] Button remains functional and triggers the confirmation dialog.
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
