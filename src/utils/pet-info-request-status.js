function hasUsableDate(value) {
    if (!value) return false;
    const date = new Date(value);
    return !Number.isNaN(date.getTime());
}

function shouldPreserveApprovedPetStatusDuringInfoRequest(pet = {}) {
    return pet.status === 'approved' && (
        hasUsableDate(pet.waiting_period_start) ||
        hasUsableDate(pet.waiting_period_end)
    );
}

function buildInfoRequestPetUpdate(pet = {}, requestMessage) {
    const update = {
        last_admin_response: requestMessage,
    };

    if (!shouldPreserveApprovedPetStatusDuringInfoRequest(pet) && pet.status !== 'action_required') {
        update.status = 'action_required';
    }

    return update;
}

function buildFulfillRequestPetUpdate(pet = {}, petField, fileUrl) {
    const update = {};

    if (petField) {
        update[petField] = fileUrl;
    }

    if (!shouldPreserveApprovedPetStatusDuringInfoRequest(pet)) {
        update.status = 'pending';
    }

    return update;
}

module.exports = {
    buildFulfillRequestPetUpdate,
    buildInfoRequestPetUpdate,
    shouldPreserveApprovedPetStatusDuringInfoRequest,
};

