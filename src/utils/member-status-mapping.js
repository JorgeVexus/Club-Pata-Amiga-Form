const APPROVAL_STATUS_BY_DERIVED_STATUS = {
    active: 'approved',
    appealed: 'appealed',
    rejected: 'rejected',
    action_required: 'action_required',
    pending: 'pending',
};

function mapPetDerivedStatusToUserStatuses(derivedStatus) {
    return {
        membership_status: derivedStatus,
        approval_status: APPROVAL_STATUS_BY_DERIVED_STATUS[derivedStatus] || 'pending',
    };
}

module.exports = {
    mapPetDerivedStatusToUserStatuses,
};

