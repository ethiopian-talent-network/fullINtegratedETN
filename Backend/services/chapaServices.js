const axios = require("axios");

const CHAPA_BASE = process.env.CHAPA_BASE;
const CHAPA_KEY = process.env.CHAPA_KEY;

const initializePayment = async (data) => {
  try {
    const response = await axios.post(
      `${CHAPA_BASE.replace(/\/$/, "")}/transaction/initialize`,
      data,

      {
        headers: {
          Authorization: `Bearer ${CHAPA_KEY}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.log(error);
    throw new Error(error.response?.data?.message || error.message);
  }
};

const verifyPayment = async (tx_ref) => {
  try {
    const response = await axios.get(
      `${CHAPA_BASE.replace(/\/$/, "")}/transaction/verify/${tx_ref}`,
      {
        headers: {
          Authorization: `Bearer ${CHAPA_KEY}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.log(error);
    throw new Error(error.response?.data?.message || error.message);
  }
};

module.exports = {
  initializePayment,
  verifyPayment,
};
