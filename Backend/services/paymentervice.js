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
      [user.id]
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
      callback_url: "http://localhost:5000/payment/verify",
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

    await connection.query(
      "update escrow set status = 'funded' where treansaction_ref = ?",
      [tx_ref],
    );

    // Get talent_id and create a payment record for owner dashboard
    const [escrowData] = await connection.query(
      "SELECT talent_id, job_id, amount, currency FROM escrow WHERE treansaction_ref = ?",
      [tx_ref]
    );

    if (escrowData.length > 0) {
      const { talent_id, job_id, amount, currency } = escrowData[0];
      
      // Get talent user_id
      const [talentData] = await connection.query(
        "SELECT user_id FROM talents WHERE id = ?",
        [talent_id]
      );

      if (talentData.length > 0) {
        const user_id = talentData[0].user_id;
        
        // Create payment record for owner dashboard
        await connection.query(
          `INSERT INTO owner_payments (talent_id, user_id, job_id, amount, currency, transaction_id, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 'completed', NOW())
           ON DUPLICATE KEY UPDATE status = 'completed', updated_at = NOW()`,
          [talent_id, user_id, job_id, amount, currency, tx_ref]
        );
      }
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
