const db = require("../config/db").promise();

exports.addCategories = async (req, res) => {
  const { name } = req.body;
  try {
    if (!name) {
      return res.status(400).json({ message: "please insert the categories" });
    }
    const sql = "select * from categories where name = ?";
    const [row] = await db.query(sql, [name]);
    if (row.length > 0) {
      return res.status(400).json({ message: "the categories already exists" });
    }
    const sql0 = "insert into categories set name = ?";

    const [row0] = await db.query(sql0, [name]);
    if (row0.affectedRows > 0) {
      return res.status(200).json({ message: "the categories added" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "something went wrong" });
  }
};

