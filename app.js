var express = require("express");
var path = require("path");
// var favicon = require("serve-favicon");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var AWS = require("aws-sdk");
var app = express();
app.listen(4000, () => console.log("Cars API listening on port 4000!"));
AWS.config.update({
  region: "eu-west-2",
  endpoint: "http://localhost:8000",
});
var docClient = new AWS.DynamoDB.DocumentClient();
var app = express();
var port = "1000";
app.set("port", port);

app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.set("view engine", "jade");
app.get("/", function (req, res) {
  res.send({ title: "Cars API Entry Point" });
});
app.get("/cars", function (req, res) {
  var params = {
    TableName: "Cars",
    ProjectionExpression:
      "#id, #name, #type, #manufacturer, #fuel_type, #description",
    ExpressionAttributeNames: {
      "#id": "id",
      "#name": "name",
      "#type": "type",
      "#manufacturer": "manufacturer",
      "#fuel_type": "fuel_type",
      "#description": "description",
    },
  };
  console.log("Scanning Cars table.");
  docClient.scan(params, onScan);
  function onScan(err, data) {
    if (err) {
      console.error(
        "Unable to scan the table. Error JSON:",
        JSON.stringify(err, null, 2)
      );
    } else {
      res.send(data);
      // print all the Cars
      console.log("Scan succeeded.");
      data.Items.forEach(function (car) {
        console.log(car.id, car.type, car.name);
      });
      if (typeof data.LastEvaluatedKey != "undefined") {
        console.log("Scanning for more...");
        params.ExclusiveStartKey = data.LastEvaluatedKey;
        docClient.scan(params, onScan);
      }
    }
  }
  app.get("/cars/:id", function (req, res) {
    var carID = parseInt(req.url.slice(6));
    console.log(req.url);
    console.log(carID);
    var params = {
      TableName: "Cars",
      KeyConditionExpression: "#id = :id",
      ExpressionAttributeNames: {
        "#id": "id",
      },
      ExpressionAttributeValues: {
        ":id": carID,
      },
    };
    docClient.query(params, function (err, data) {
      if (err) {
        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
      } else {
        console.log("Query succeeded.");
        res.send(data.Items);
        data.Items.forEach(function (car) {
          console.log(car.id, car.name, car.type);
        });
      }
    });
  });
});
module.exports = app;
