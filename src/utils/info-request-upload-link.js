function normalizeBaseUrl(baseUrl) {
    return (baseUrl || 'https://app.pataamiga.mx').replace(/\/+$/, '');
}

function buildInfoRequestUploadUrl({
    baseUrl,
    memberId,
    petIndex,
    petId,
    requestTypes,
    logId,
    token,
    exp,
}) {
    const params = new URLSearchParams({
        m: memberId,
        p: String(petIndex),
        t: token,
        exp: String(exp),
        rt: requestTypes.join(','),
    });

    if (petId) params.set('petId', petId);
    if (logId) params.set('log', logId);

    return `${normalizeBaseUrl(baseUrl)}/completar-documentacion?${params.toString()}`;
}

module.exports = {
    buildInfoRequestUploadUrl,
};

