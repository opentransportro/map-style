var fs = require("fs");
var express = require("express");

var index = fs.readFileSync("index.html", "utf8");

var style = require("./index").generateStyle({
  glyphsUrl: "https://static.hsl.fi/mapfonts/",
  components: {
    text: { enabled: true },
    otp_stops: { enabled: true },
    otp_stations: { enabled: true }
  }
});

var app = express();

app.use(express.static("sprites"));

app.get("/", function (req, res) {
  res.redirect("/index.html");
});

app.get("/index.html", function (req, res) {
  res.set("Content-Type", "text/html");
  res.send(index);
});

app.get("/style.json", function (req, res) {
  res.set("Content-Type", "application/json");
  res.send(style);
});

app.listen(3000, function () {
  console.log("Listening at localhost:3000");
});
