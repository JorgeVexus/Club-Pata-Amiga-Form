const { getMemberDetails } = require('./src/services/memberstack-admin.service');
require('dotenv').config({ path: '.env.local' });

async function run() {
    const memberId = 'mem_cmos033ff11dd0sqd1m42b3mg';
    console.log('Fetching Memberstack details for:', memberId);
    const result = await getMemberDetails(memberId);
    if (result.success) {
        console.log('Custom Fields:', JSON.stringify(result.data.customFields, null, 2));
    } else {
        console.error('Error fetching member details:', result.error);
    }
}

run();
