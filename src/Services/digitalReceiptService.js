import { formatToXDRE } from './xdreceiptService.js';

export const convertToXDREFormat = async (receipt, transaction, lineItems) => {
    try {
        console.log('Converting receipt to XDRE format:', {
            receipt,
            transaction,
            lineItems
        });

        const xdreReceipt = formatToXDRE(receipt, transaction, lineItems);
        console.log('XDRE receipt created:', xdreReceipt);

        return xdreReceipt;
    } catch (error) {
        console.error('Error converting receipt to XDRE format:', error);
        throw new Error('Failed to convert receipt to XDRE format');
    }
}; 