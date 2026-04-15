exports.getDashboard = async (req, res) => {
  try {
    return res.status(200).json({ message: "Dashboard" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "something went wrong" });
  }
};
