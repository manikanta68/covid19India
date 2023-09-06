const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API 1
app.get("/states/", async (request, response) => {
  const getStateQuery = `SELECT * FROM state;`;
  const statesArray = await db.all(getStateQuery);
  const ans = (statesList) => {
    return {
      stateId: statesList.state_id,
      stateName: statesList.state_name,
      population: statesList.population,
    };
  };
  response.send(statesArray.map((eachState) => ans(eachState)));
});

//API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT * FROM state WHERE state_id=${stateId};`;
  const statesArray = await db.get(getStateQuery);
  const ans = (statesList) => {
    return {
      stateId: statesList.state_id,
      stateName: statesList.state_name,
      population: statesList.population,
    };
  };
  response.send(ans(statesArray));
});

//API 3
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addStateQuery = `INSERT INTO district (district_name,state_id,cases,cured,active,deaths)
     VALUES ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const dbResponse = await db.run(addStateQuery);
  response.send("District Successfully Added");
});

//API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT * FROM district WHERE district_id=${districtId};`;
  const district = await db.get(getDistrictQuery);
  const ans = (districtsList) => {
    return {
      districtId: districtsList.district_id,
      districtName: districtsList.district_name,
      stateId: districtsList.state_id,
      cases: districtsList.cases,
      cured: districtsList.cured,
      active: districtsList.active,
      deaths: districtsList.deaths,
    };
  };
  response.send(ans(district));
});

//API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `DELETE FROM district WHERE district_id=${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const UpdateQuery = `
            UPDATE district 
            SET 
                district_name='${districtName}',
                state_id=${stateId},
                cases=${cases},
                cured=${cured},
                active=${active},
                deaths=${deaths}
            WHERE district_id=${districtId};`;
  await db.run(updateQuery);
  response.send("District Details Updated");
});

//API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `SELECT SUM(cases),SUM(cured),SUM(active),SUM(deaths) FROM district WHERE state_id=${stateId};`;
  const stats = await db.get(getStatsQuery);
  console.log(stats);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT state_id FROM district WHERE district_id=${districtId};`;
  const dbResponse = await db.get(getDistrictQuery);
  const stateDetails = `SELECT state_name AS stateName FROM state WHERE state_id=${dbResponse.state_id};`;
  const dbStateDetails = await db.get(stateDetails);
  response.send(dbStateDetails);
});

module.exports = app;
