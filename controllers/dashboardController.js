exports.getDashboardData = (req, res) => {
  const role = req.user.role;

  if (role === "admin") {
    res.json({
      welcome: "Welcome Admin!",
      stats: { users: 200, revenue: "$10,000", systemLoad: "Moderate" },
    });
  } else {
    res.json({
      welcome: "Welcome User!",
      stats: { visits: 150, activity: "Active", supportTickets: 3 },
    });
  }
};
