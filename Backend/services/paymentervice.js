const db = require("../config/db");
const chapa = require("./chapaServices");
const { v4: uuidv4 } = require("uuid");

exports.createPayment = async (user, currency, amount, job_id, method) => {
  const connection = await db.getConnection();

  try {
    if (!user || !user.id) {
      throw new Error("unathorized access");
    }

    if (!currency || !job_id || !amount || !method) {
      throw new Error("invalid payment");
    }

    await connection.beginTransaction();

    // Get employer_id from user_id
    const [employerRows] = await connection.query(
      "SELECT id FROM employers WHERE user_id = ?",
      [user.id],
    );

    if (employerRows.length === 0) {
      throw new Error("Employer profile not found");
    }

    const employer_id = employerRows[0].id;

    const [checkHiredTalent] = await connection.query(
      "SELECT talent_id FROM applications WHERE job_id = ? AND status IN ('shortlisted', 'hired')",
      [job_id],
    );

    if (checkHiredTalent.length === 0) {
      throw new Error("No hired talent found for this application");
    }

    const talent_id = checkHiredTalent[0].talent_id;

    const tx_ref = uuidv4();

    const sql = "INSERT INTO payments set ?";
    const values = {
      job_id,
      client_id: employer_id,
      amount,
      transaction_id: tx_ref,
      currency,
      method,
      status: "pending",
    };
    await connection.query(sql, values);

    await connection.query(
      "INSERT INTO escrow (job_id, talent_id , employer_id , amount , currency , status , treansaction_ref) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [job_id, talent_id, employer_id, amount, currency, "pending", tx_ref],
    );

    const chapaResponse = await chapa.initializePayment({
      amount,
      currency,
      method,
      email: user.email,
      first_name: user.company_name,
      last_name: "user",
      tx_ref,
      callback_url: `http://localhost:5000/api/payment/verify`,
    });

    const checkout_url = chapaResponse?.data?.checkout_url;

    if (!checkout_url) {
      throw new Error("Failed to get checkout URL from Chapa");
    }

    await connection.commit();

    return { check_url: checkout_url };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

exports.verfiyAndUpdateTransaction = async (tx_ref) => {
  const connection = await db.getConnection();
  try {
    if (!tx_ref) throw new Error("invalid transaction ID");

    await connection.beginTransaction();

    const result = await chapa.verifyPayment(tx_ref);

    if (result.status !== "success") {
      throw new Error("api fetching is failed");
    }
    const paymentData = result.data;

    const [paymentRows] = await connection.query(
      "SELECT * FROM payments WHERE transaction_id = ? FOR UPDATE",
      [tx_ref],
    );

    if (paymentRows.length === 0) {
      throw new Error("transaction not found");
    }
    const payment = paymentRows[0];

    if (payment.status === "success") {
      await connection.commit();
      return payment;
    }
    if (paymentData.status !== "success") {
      await connection.query(
        "update payments set status = 'failed' where transaction_id = ?",
        [tx_ref],
      );
      await connection.query(
        "update escrow set status = 'failed' where treansaction_ref = ?",
        [tx_ref],
      );
      await connection.commit();
      throw new Error("payment failed");
    }

    if (
      payment.amount !== paymentData.amount ||
      payment.currency !== paymentData.currency
    ) {
      throw new Error("payment amount or currency does not match");
    }

    await connection.query(
      "update payments set status = 'success' where transaction_id = ?",
      [tx_ref],
    );

    // Keep escrow as 'pending' until owner/admin approves
    // Don't automatically set to 'funded' - wait for admin verification
    await connection.query(
      "update escrow set status = 'pending_approval' where treansaction_ref = ?",
      [tx_ref],
    );

    // Create payment verification record for admin review
    const [escrowData] = await connection.query(
      "SELECT talent_id, job_id, amount, currency, employer_id FROM escrow WHERE treansaction_ref = ?",
      [tx_ref],
    );

    if (escrowData.length > 0) {
      const { talent_id, job_id, amount, currency, employer_id } =
        escrowData[0];

      // Add job_id to payment object for redirect
      payment.job_id = job_id;

      // Create payment verification record
      await connection.query(
        `INSERT INTO payment_verifications
         (payment_id, job_id, employer_id, talent_id, amount, currency, transaction_id, payment_method, payment_date, verification_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'pending')
         ON DUPLICATE KEY UPDATE verification_status = 'pending'`,
        [
          payment.id,
          job_id,
          employer_id,
          talent_id,
          amount,
          currency,
          tx_ref,
          payment.method,
        ],
      );
    }

    await connection.commit();
    return payment;
  } catch (error) {
    connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
