const db = require("../config/db").promise();

exports.updateMonthlyToken = async (talent_id) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const [user] = await connection.query(
      "SELECT balance , last_token_reset FROM tokens WHERE talent_id = ?",
      [talent_id],
    );

    const now = new Date();
    const lastUpdate = new Date(user[0].last_token_reset);

    const newMonth =
      now.getMonth() !== lastUpdate.getMonth() ||
      now.getFullYear() !== lastUpdate.getFullYear();

    if (newMonth) {
      await connection.query(
        "update tokens set balance = balance + 20, last_token_reset = NOW() where talent_id = ?",
        [talent_id],
      );

      await connection.query(
        "INSERT INTO token_transactions (talent_id, amount, type , reason) VALUES (?, 20, 'credit', 'monthly_token_reset')",
        [talent_id],
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
  } finally {
    connection.release();
  }
};


