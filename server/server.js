import express from "express";
const app = express();

const PORT = 5000;

app.get("/", (req, res) => {
  res.send("Welcome to the Focused API!");
});

//App listen
app.listen(PORT, () => {
  console.log(`Server running on on port: ${PORT}!`);
});
