function mapPetDerivedStatusToUserStatuses(derivedStatus) {
    void derivedStatus;
    return {
        membership_status: 'active',
        approval_status: 'approved',
    };
}

module.exports = {
    mapPetDerivedStatusToUserStatuses,
};
