export const merchantConfig = {
    name: process.env.MERCHANT_NAME || 'Gardeco',
    branch: {
        branchName: process.env.MERCHANT_BRANCH_NAME || 'Gardeco Main',
        slogan: 'Din lokala bygghandel',
        email: process.env.MERCHANT_EMAIL || 'contact@gardeco.no',
        phone: process.env.MERCHANT_PHONE || '+47 12345678',
        websiteUrl: process.env.MERCHANT_WEBSITE || 'https://www.gardeco.no',
        address: {
            addressLine1: process.env.MERCHANT_ADDRESS || 'Your Address',
            city: process.env.MERCHANT_CITY || 'Your City',
            zipCode: process.env.MERCHANT_ZIP || '12345',
            country: process.env.MERCHANT_COUNTRY || 'Norway'
        }
    }
}; 