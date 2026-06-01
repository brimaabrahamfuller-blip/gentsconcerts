const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const MTN_BASE_URL = 'https://sandbox.momodeveloper.mtn.com';
const SUBSCRIPTION_KEY = process.env.MTN_SUBSCRIPTION_KEY;
const API_USER = process.env.MTN_API_USER;
const API_KEY = process.env.MTN_API_KEY;

const mtnMomo = {
    // 1. createApiUser() - create sandbox API user
    createApiUser: async () => {
        const referenceId = uuidv4();
        try {
            await axios.post(`${MTN_BASE_URL}/v1_0/apiuser`, {
                providerCallbackHost: process.env.MTN_CALLBACK_URL.split('/api')[0]
            }, {
                headers: {
                    'X-Reference-Id': referenceId,
                    'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY
                }
            });
            return referenceId;
        } catch (error) {
            console.error('Error creating API user:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    // 2. getAccessToken() - get OAuth token
    getAccessToken: async () => {
        const auth = Buffer.from(`${API_USER}:${API_KEY}`).toString('base64');
        try {
            const response = await axios.post(`${MTN_BASE_URL}/collection/token/`, {}, {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY
                }
            });
            return response.data.access_token;
        } catch (error) {
            console.error('Error getting access token:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    // 3. requestToPay(amount, currency, phoneNumber, externalId, description)
    requestToPay: async (amount, currency, phoneNumber, externalId, description) => {
        const token = await mtnMomo.getAccessToken();
        const referenceId = uuidv4();
        try {
            await axios.post(`${MTN_BASE_URL}/collection/v1_0/requesttopay`, {
                amount: amount.toString(),
                currency: currency,
                externalId: externalId,
                payer: {
                    partyIdType: 'MSISDN',
                    partyId: phoneNumber
                },
                payerMessage: description,
                payeeNote: 'GentsConcerts Ticket Purchase'
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Reference-Id': referenceId,
                    'X-Target-Environment': 'sandbox',
                    'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY
                }
            });
            return referenceId;
        } catch (error) {
            console.error('Error requesting to pay:', error.response ? error.response.data : error.message);
            throw error;
        }
    },

    // 4. getPaymentStatus(referenceId) - check if payment was successful
    getPaymentStatus: async (referenceId) => {
        const token = await mtnMomo.getAccessToken();
        try {
            const response = await axios.get(`${MTN_BASE_URL}/collection/v1_0/requesttopay/${referenceId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Target-Environment': 'sandbox',
                    'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error getting payment status:', error.response ? error.response.data : error.message);
            throw error;
        }
    }
};

module.exports = mtnMomo;
