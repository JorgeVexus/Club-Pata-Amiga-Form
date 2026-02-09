const memberstackAdminKey = process.env.MEMBERSTACK_ADMIN_SECRET_KEY;

async function checkMember(email) {
    if (!memberstackAdminKey) {
        console.error('MEMBERSTACK_ADMIN_SECRET_KEY is missing');
        return;
    }

    try {
        const response = await fetch(`https://admin.memberstack.com/members?email=${encodeURIComponent(email)}`, {
            headers: {
                'X-API-KEY': memberstackAdminKey,
            },
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Member search result:', JSON.stringify(data, null, 2));
        } else {
            console.error('Error searching member:', response.status, await response.text());
        }

    } catch (error) {
        console.error('Fetch error:', error);
    }
}

// Replace with the email the user is trying to register
const emailToCheck = 'admin@pataamiga.com'; // Example, ideally prompt or use a known test email
checkMember(emailToCheck);
