const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

const MTN_TOKEN_URL = "https://api.mtn.com/v1/oauth/access_token";
const MTN_BASE_URL = "https://sandbox.momodeveloper.mtn.com"; // Corrected to sandbox URL
const CONSUMER_KEY = process.env.MOMO_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MOMO_CONSUMER_SECRET;
const SUBSCRIPTION_KEY = process.env.MTN_SUBSCRIPTION_KEY; // Assuming this is still needed for other calls

const mtnMomo = {
    // 1. getAccessToken() - Updated for Global Developer Portal OAuth 2.0
    getAccessToken: async () => {
        try {
            const params = new URLSearchParams();
            params.append("grant_type", "client_credentials");
            params.append("client_id", CONSUMER_KEY);
            params.append("client_secret", CONSUMER_SECRET);

            const response = await axios.post(MTN_TOKEN_URL, params, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            });
            return response.data.access_token;
        } catch (error) {
            console.error("Error getting access token:", error.response ? error.response.data : error.message);
            throw error;
        }
    },

    // 2. requestToPay(amount, currency, phoneNumber, externalId, description)
    requestToPay: async (amount, currency, phoneNumber, externalId, description) => {
        const token = await mtnMomo.getAccessToken();
        const referenceId = uuidv4();
        try {
            await axios.post(`${MTN_BASE_URL}/collection/v1_0/requesttopay`, {
                amount: amount.toString(),
                currency: currency,
                externalId: externalId,
                payer: {
                    partyIdType: "MSISDN",
                    partyId: phoneNumber
                },
                payerMessage: description,
                payeeNote: "GentsConcerts Ticket Purchase"
            }, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "X-Reference-Id": referenceId,
                    "X-Target-Environment": "sandbox", // Corrected to sandbox
                    "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY, // Assuming this is still needed
                    "Content-Type": "application/json"
                }
            });
            return referenceId;
        } catch (error) {
            console.error("Error requesting to pay:", error.response ? error.response.data : error.message);
            throw error;
        }
    },

    // 3. getPaymentStatus(referenceId) - check if payment was successful
    getPaymentStatus: async (referenceId) => {
        const token = await mtnMomo.getAccessToken();
        try {
            const response = await axios.get(`${MTN_BASE_URL}/collection/v1_0/requesttopay/${referenceId}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "X-Target-Environment": "sandbox", // Corrected to sandbox
                    "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY // Assuming this is still needed
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error getting payment status:", error.response ? error.response.data : error.message);
            throw error;
        }
    }
};

module.exports = mtnMomo;
