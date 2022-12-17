import * as React from "react";
import * as d3 from "d3";

import { grey, blueGrey, red } from "@mui/material/colors";

import F1CarIcon from "../svg/F1CarIcon";

import {
  Box,
  Typography,
  Grid,
  Container,
  Paper,
  Stack,
  Divider,
} from "@mui/material";

import SportsMotorsportsIcon from "@mui/icons-material/SportsMotorsports";

import { motion } from "framer-motion";

import { timeToString, calcTimeToLeader, calculateAge } from "../helpers/time";
import constructorColors from "../helpers/constructorColors";
import brightnessByColor from "../helpers/brightnessByColor";
import { countryFromNationality } from "../helpers/countries";

import { resultStatus, resultStatusToText } from "../helpers/constants";

function Race({ data, lap, width, height, numLaps }) {
  const margin = {
    top: 8,
    right: 15,
    bottom: 8 + height / 2,
    left: 15,
    middle: 8,
  };

  const [tooltipState, setTooltipState] = React.useState({
    x: 50,
    y: 50,
    selectedDriver: null,
  });
  const [tooltipEnabled, setTooltipEnabled] = React.useState(false);

  const [clickSelectedDriver, setClickSelectedDriver] = React.useState(null);

  const handleClickSelectedDriver = (selectedDriver) => {
    if (selectedDriver == clickSelectedDriver) {
      setClickSelectedDriver(null);
    } else {
      setClickSelectedDriver(selectedDriver);
    }
  };

  const handleTooltip = (event, selectedDriver) => {
    setTooltipEnabled(true);
    setTooltipState({
      x: event.pageX,
      y: event.pageY,
      selectedDriver: selectedDriver,
    });
  };

  if (data) {
    const lapData = data.lapData.MRData.RaceTable.Races[0];
    const results = data.results.MRData.RaceTable.Races[0];
    numLaps = numLaps - 1;

    const constructors = data.constructorData.MRData.ConstructorTable;

    const getDriver = (driverId) => {
      return results.Results.filter(
        (result) => result.Driver.driverId === driverId
      )[0];
    };

    const drawSelectedDriverLegend = (driverId) => {
      const driverDetails = getDriver(driverId);
      const retiredDrivers = getRetiredDrivers();
      const lappedDrivers = getLappedDrivers();

      let driver;

      if (
        retiredDrivers.filter((driver) => driver.Driver.driverId == driverId)
          .length > 0 ||
        lappedDrivers.filter((driver) => driver.Driver.driverId == driverId)
          .length > 0
      ) {
        const driverResult = results.Results.filter(
          (result) => result.Driver.driverId == driverId
        )[0];

        driver = {
          ...driverDetails,
          position: driverResult.position,
          visibleStatus: driverResult.status,
        };
      } else {
        const driverLap = lapData.Laps[lap].Timings.filter(
          (lap) => lap.driverId == driverId
        )[0];

        driver = {
          ...driverDetails,
          totalTime: driverLap.totalTime,
          lapTime: driverLap.time,
          position: Number.parseInt(driverLap.position),
          timeToLeader: calcTimeToLeader(
            lapData.Laps[lap].Timings[0].totalTime,
            driverLap.totalTime
          ),
        };
      }

      return (
        <Paper elevation={1} style={{ padding: "5px" }}>
          <Box>
            <Stack direction="row" alignItems="center" gap={1}>
              <SportsMotorsportsIcon />
              <Typography variant="h6" fontWeight={800} noWrap>
                {driver.Driver.givenName + " " + driver.Driver.familyName}
              </Typography>
              <Typography variant="overline" pr={1}>
                {driver.Driver.permanentNumber}
              </Typography>
            </Stack>
            <Typography variant="overline">Selected Driver</Typography>
            <Stack direction="row" justifyContent="center" alignItems="center">
              <Stack
                direction="column"
                justifyContent="center"
                alignItems="center"
              >
                <Typography variant="h6" fontWeight={800}>
                  P{driver.position}
                </Typography>

                <Typography variant="body2">Position</Typography>
                {driver.visibleStatus && (
                  <Typography variant="caption" fontStyle={"italic"}>
                    Status: {driver.visibleStatus}
                  </Typography>
                )}
              </Stack>

              {lap != 0 && Number.isInteger(driver.position) && (
                <Grid
                  container
                  columns={2}
                  spacing={0.5}
                  alignItems="center"
                  // TODO: Figure out why the grid is adding this weird margin
                  ml={-3}
                  mr={-3}
                >
                  <Grid item xs={1}>
                    <Typography variant="body2" textAlign="right">
                      Gap to Leader
                    </Typography>
                  </Grid>
                  <Grid item xs={1}>
                    <Typography variant="h6" fontWeight={800}>
                      {driver.timeToLeader == 0
                        ? "Leader"
                        : "+" + timeToString(driver.timeToLeader)}
                    </Typography>
                  </Grid>
                  <Grid item xs={1}>
                    <Typography variant="body2" textAlign="right">
                      Lap Time
                    </Typography>
                  </Grid>
                  <Grid item xs={1}>
                    <Typography variant="h6" fontWeight={800}>
                      {driver.lapTime}
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </Stack>
          </Box>
        </Paper>
      );
    };

    const getLappedDrivers = () => {
      const allLappedCars = results.Results.filter(
        (result) =>
          parseInt(result.laps) < numLaps &&
          !(
            result.positionText == resultStatus.retired ||
            result.positionText == resultStatus.disqualified ||
            result.positionText == resultStatus.withdrawn
          )
      );
      return allLappedCars.filter(
        (lappedCar) =>
          !lapData.Laps[lap].Timings.some(
            (driver) => driver.driverId == lappedCar.Driver.driverId
          )
      );
    };

    const getRetiredDrivers = () => {
      const allRetired = results.Results.filter(
        (result) =>
          result.positionText == resultStatus.retired ||
          result.positionText == resultStatus.disqualified ||
          result.positionText == resultStatus.withdrawn
      );
      return allRetired.filter((retired) => {
        return !lapData.Laps[lap].Timings.some(
          (driver) => driver.driverId === retired.Driver.driverId
        );
      });
    };

    const drawRetiredAndLappedDrivers = () => {
      const retiredDrivers = getRetiredDrivers().sort(
        (a, b) => parseInt(a.position) - parseInt(b.position)
      );
      const lappedDrivers = getLappedDrivers().sort(
        (a, b) => parseInt(a.position) - parseInt(b.position)
      );

      let data = [];

      if (retiredDrivers.length > 0) {
        data.push({
          label: "Retired Drivers",
          drivers: retiredDrivers,
          lapped: false,
        });
      }

      if (lappedDrivers.length > 0) {
        data.push({
          label: "Finished Lapped Drivers",
          drivers: lappedDrivers,
          lapped: true,
        });
      }

      const circleR = 5;

      return (
        <>
          <rect
            width={width - margin.left - margin.right}
            height={height / 2 - margin.middle - 10}
            y={height - margin.bottom + margin.middle + 5}
            x={margin.right}
            fill={blueGrey[100]}
            rx={2}
          />
          {retiredDrivers.length == 0 && lappedDrivers.length == 0 && (
            <text
              y={height - margin.bottom + margin.middle + 2.5}
              x={-circleR}
              transform={`translate(${
                margin.right + circleR + circleR / 2
              }, 0)`}
              fontSize={4}
              textAnchor="left"
              dominantBaseline={"central"}
              fontFamily="Roboto"
              fill={blueGrey[700]}
            >
              Non-Racing Drivers
            </text>
          )}
          {data.map((d, j) => {
            let leftOffset = 0;
            if (j > 0) {
              let multiplier = data[j - 1].drivers.length - 1;
              if (multiplier < 1) {
                multiplier = 1;
              }
              leftOffset =
                margin.right +
                circleR +
                circleR / 2 +
                2.5 * multiplier * circleR;
            }

            return (
              <>
                {j > 0 && data[j].drivers.length > 0 && (
                  <line
                    y1={
                      height / 2 -
                      margin.middle -
                      10 +
                      height -
                      margin.bottom +
                      margin.middle +
                      5 -
                      1
                    }
                    y2={height - margin.bottom + margin.middle + 5 + 1}
                    transform={`translate(${
                      (margin.right + circleR + circleR / 2) / 2 + leftOffset
                    }, 0)`}
                    stroke={blueGrey[700]}
                    strokeWidth={0.5}
                  />
                )}
                {d.drivers.map((driverDetails, i) => {
                  const constructorColor =
                    constructorColors[driverDetails.Constructor.constructorId];

                  let textColor = "#FFFFFF";
                  if (brightnessByColor(constructorColor) > 127.5) {
                    textColor = "#000000";
                  }

                  return (
                    <g
                      key={driverDetails.Driver.driverId}
                      onMouseMove={(e) => {
                        const driverResult = results.Results.filter(
                          (result) =>
                            result.Driver.driverId ==
                            driverDetails.Driver.driverId
                        )[0];
                        const toolTip = {
                          ...driverDetails,
                          position: driverResult.position,
                          visibleStatus: driverResult.status,
                        };
                        handleTooltip(e, toolTip);
                      }}
                      onMouseOut={() => {
                        setTooltipEnabled(false);
                      }}
                      transform={`translate(${
                        margin.right +
                        circleR +
                        circleR / 2 +
                        2.5 * i * circleR +
                        leftOffset
                      }, ${height / 2 + margin.middle + margin.top})`}
                      onClick={(_) => {
                        handleClickSelectedDriver(
                          driverDetails.Driver.driverId
                        );
                      }}
                    >
                      {i == 0 && (
                        <text
                          y={-(height / 2 - margin.middle - 10) / 2 - 1}
                          x={-circleR}
                          fontSize={4}
                          textAnchor="left"
                          dominantBaseline={"top"}
                          fontFamily="Roboto"
                          fill={blueGrey[700]}
                        >
                          {d.label}
                        </text>
                      )}
                      {clickSelectedDriver == driverDetails.Driver.driverId && (
                        <motion.circle
                          cy="-8"
                          r="1"
                          stroke="black"
                          strokeWidth="0.5"
                          fill={red[300]}
                        />
                      )}
                      <circle
                        r={circleR}
                        stroke="black"
                        strokeWidth={"0.5"}
                        fill={constructorColor}
                      />
                      <text
                        y={driverDetails.Driver?.permanentNumber ? -0.75 : 0}
                        fontSize={3.5}
                        textAnchor="middle"
                        dominantBaseline={"central"}
                        fontFamily="Roboto"
                        fill={textColor}
                      >
                        {driverDetails.Driver?.code
                          ? driverDetails.Driver.code
                          : driverDetails.Driver.driverId
                              .substring(0, 3)
                              .toUpperCase()}
                      </text>
                      <text
                        y={2.25}
                        fontSize={3}
                        textAnchor={"middle"}
                        dominantBaseline={"central"}
                        fill={textColor}
                        fontFamily="Roboto"
                      >
                        {driverDetails.Driver.permanentNumber}
                      </text>
                    </g>
                  );
                })}
              </>
            );
          })}
        </>
      );
    };

    const valueRage = d3.extent(
      lapData.Laps[lap].Timings.map((d) => {
        return d.totalTime;
      })
    );

    let xScale = d3
      .scaleLinear()
      .domain(valueRage)
      .range([margin.left, width - margin.right]);

    const ticks = d3.range(
      valueRage[0],
      valueRage[1],
      (valueRage[1] - valueRage[0]) / 8
    );
    ticks.push(valueRage[1]);

    // TODO: Fix rerendering

    return (
      <>
        <Stack direction="row" alignItems="center">
          {/* Race Chart */}
          <Box width="100%">
            <svg
              style={{ zIndex: -1 }}
              viewBox={`0 0 ${width} ${height}`}
              id="raceView"
            >
              {/* Chart Axis */}
              {ticks.map((x, i) => {
                const timeToLeader = calcTimeToLeader(
                  lapData.Laps[lap].Timings[0].totalTime,
                  x
                );
                return (
                  <g key={x} transform={`translate(${xScale(x)}, 0)`}>
                    {i % 2 === 1 && (
                      <rect
                        width={xScale(x) - xScale(ticks[i - 1])}
                        height={height - margin.bottom - margin.top}
                        y={margin.top}
                        fill={blueGrey[100]}
                      />
                    )}
                    <line
                      y1={height - margin.bottom + 1}
                      y2={height - margin.bottom - 1}
                      stroke={blueGrey[700]}
                      strokeWidth={0.5}
                    />
                    <text
                      fontSize={4}
                      fill={blueGrey[700]}
                      textAnchor="middle"
                      dominantBaseline={"hanging"}
                      fontFamily="Roboto"
                      y={height - margin.bottom + 2}
                    >
                      {timeToLeader == 0
                        ? "Leader"
                        : "+" + timeToString(timeToLeader)}
                    </text>
                  </g>
                );
              })}
              <line
                x1={margin.left}
                x2={width - margin.right}
                transform={`translate(0, ${height - margin.bottom})`}
                stroke={blueGrey[700]}
                strokeWidth={0.5}
              />
              {/* Driver Position */}
              {lapData.Laps[lap].Timings.map((d) => {
                const driverDetails = getDriver(d.driverId);

                const constructorColor =
                  constructorColors[driverDetails.Constructor.constructorId];

                let textColor = "#FFFFFF";
                if (brightnessByColor(constructorColor) > 127.5) {
                  textColor = "#000000";
                }

                return (
                  <g
                    key={d.driverId}
                    onMouseMove={(e) => {
                      handleTooltip(e, {
                        ...driverDetails,
                        totalTime: d.totalTime,
                        lapTime: d.time,
                        position: Number.parseInt(d.position),
                        timeToLeader: calcTimeToLeader(
                          lapData.Laps[lap].Timings[0].totalTime,
                          d.totalTime
                        ),
                      });
                    }}
                    onMouseOut={() => {
                      setTooltipEnabled(false);
                    }}
                    transform={`translate(0, ${
                      (height - margin.bottom - margin.top) / 2 + margin.top
                    })`}
                    onClick={(_) => {
                      handleClickSelectedDriver(d.driverId);
                    }}
                  >
                    {clickSelectedDriver == d.driverId && (
                      <motion.circle
                        animate={{
                          cx: xScale(d.totalTime),
                        }}
                        cy="-8"
                        r="1"
                        stroke="black"
                        strokeWidth="0.5"
                        fill={red[300]}
                      />
                    )}
                    <motion.circle
                      animate={{
                        cx: xScale(d.totalTime),
                      }}
                      r="5"
                      stroke="black"
                      strokeWidth={"0.5"}
                      fill={constructorColor}
                    />
                    <motion.text
                      animate={{ x: xScale(d.totalTime) }}
                      y={driverDetails.Driver?.permanentNumber ? -0.75 : 0}
                      fontSize={3.5}
                      textAnchor="middle"
                      dominantBaseline={"central"}
                      fontFamily="Roboto"
                      fill={textColor}
                    >
                      {driverDetails.Driver?.code
                        ? driverDetails.Driver.code
                        : driverDetails.Driver.driverId
                            .substring(0, 3)
                            .toUpperCase()}
                    </motion.text>
                    <motion.text
                      animate={{ x: xScale(d.totalTime) }}
                      y={2.25}
                      fontSize={3}
                      textAnchor={"middle"}
                      dominantBaseline={"central"}
                      fill={textColor}
                      fontFamily="Roboto"
                    >
                      {driverDetails.Driver.permanentNumber}
                    </motion.text>
                  </g>
                );
              })}
              {/* Retired Drivers*/}
              {drawRetiredAndLappedDrivers()}
            </svg>
          </Box>
          {/* Selected Driver Legend */}
          {clickSelectedDriver && drawSelectedDriverLegend(clickSelectedDriver)}
        </Stack>
        {/* Legend */}
        <Typography variant="h5" fontWeight={800} pb={2}>
          Constructor Legend
        </Typography>
        <Grid container spacing={2}>
          {constructors.Constructors.map((constructor) => {
            const drivers = results.Results.filter(
              (result) =>
                result.Constructor.constructorId === constructor.constructorId
            );

            return (
              <Grid item xs={3}>
                <div
                  style={{
                    float: "left",
                    width: "18px",
                    height: "18px",
                    border: "2px solid black",
                    boxSizing: "border-box",
                    MozBoxSizing: "border-box",
                    WebkitBoxSizing: "border-box",
                    WebkitBorderRadius: "9px",
                    MozBorderRadius: "9px",
                    borderRadius: "9px",
                    marginRight: "4px",
                    background: constructorColors[constructor.constructorId],
                  }}
                />
                <Typography variant="body1" fontWeight={800}>
                  {constructor.name}
                </Typography>
                {drivers.map((driver) => {
                  return (
                    <>
                      <Stack direction="row" alignItems="baseline" gap={1}>
                        <Typography variant="body2" noWrap>
                          {driver.Driver.givenName} {driver.Driver.familyName}
                        </Typography>
                        <Typography variant="overline">
                          (
                          {driver.Driver?.code
                            ? driver.Driver.code
                            : driver.Driver.driverId
                                .substring(0, 3)
                                .toUpperCase()}
                          )
                        </Typography>
                      </Stack>
                      {driver.positionText == resultStatus.failedToQualify ||
                        driver.positionText == resultStatus.excluded ||
                        (driver.positionText == resultStatus.withdrawn && (
                          <Typography
                            variant="caption"
                            noWrap
                            fontStyle={"italic"}
                          >
                            Did not race: {driver.status}
                          </Typography>
                        ))}
                    </>
                  );
                })}
              </Grid>
            );
          })}
        </Grid>
        {/* Tooltip */}
        <motion.div
          animate={{
            x: tooltipState.x + 15,
            y: tooltipState.y,
          }}
          style={{
            position: "absolute",
            left: "0px",
            top: "0px",
            visibility: tooltipEnabled ? "visible" : "hidden",
            dominantBaseline: "hanging",
          }}
        >
          <Paper elevation={3} style={{ padding: "5px" }}>
            {tooltipState.selectedDriver && (
              <Box>
                <Stack direction="row" alignItems="center" gap={1}>
                  <SportsMotorsportsIcon />
                  <Typography variant="h5" fontWeight={800}>
                    {tooltipState.selectedDriver.Driver.givenName +
                      " " +
                      tooltipState.selectedDriver.Driver.familyName}
                  </Typography>
                  <Typography variant="overline" pr={1}>
                    {tooltipState.selectedDriver.Driver.permanentNumber}
                  </Typography>
                </Stack>
                <Typography variant="overline">Race Stats</Typography>
                <Stack
                  direction="row"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Stack
                    direction="column"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Typography variant="h6" fontWeight={800}>
                      P{tooltipState.selectedDriver.position}
                    </Typography>
                    <Typography variant="body2">Position</Typography>
                    {tooltipState.selectedDriver.visibleStatus && (
                      <Typography variant="caption" fontStyle={"italic"}>
                        Status: {tooltipState.selectedDriver.visibleStatus}
                      </Typography>
                    )}
                  </Stack>

                  {lap != 0 &&
                    Number.isInteger(tooltipState.selectedDriver.position) && (
                      <Grid
                        container
                        columns={2}
                        spacing={0.5}
                        alignItems="center"
                        // TODO: Figure out why the grid is adding this weird margin
                        ml={-5}
                        mr={-5}
                      >
                        <Grid item xs={1}>
                          <Typography variant="body2" textAlign="right">
                            Gap to Leader
                          </Typography>
                        </Grid>
                        <Grid item xs={1}>
                          <Typography variant="h6" fontWeight={800}>
                            {tooltipState.selectedDriver.timeToLeader == 0
                              ? "Leader"
                              : "+" +
                                timeToString(
                                  tooltipState.selectedDriver.timeToLeader
                                )}
                          </Typography>
                        </Grid>
                        <Grid item xs={1}>
                          <Typography variant="body2" textAlign="right">
                            Lap Time
                          </Typography>
                        </Grid>
                        <Grid item xs={1}>
                          <Typography variant="h6" fontWeight={800}>
                            {tooltipState.selectedDriver.lapTime}
                          </Typography>
                        </Grid>
                      </Grid>
                    )}
                </Stack>
                <Typography variant="overline">Driver Details</Typography>
                <Typography variant="body2">
                  <span
                    class={`fi fi-${countryFromNationality(
                      tooltipState.selectedDriver.Driver.nationality
                    ).alpha_2_code.toLowerCase()} fib`}
                    style={{ border: "1px solid black" }}
                  ></span>{" "}
                  {tooltipState.selectedDriver.Driver.nationality}
                </Typography>
                <Typography variant="body2">
                  Age at the Race:{" "}
                  {calculateAge(
                    tooltipState.selectedDriver.Driver.dateOfBirth,
                    results.date
                  )}
                </Typography>
                <br />
                <Stack direction="row" alignItems="center" gap={1}>
                  <F1CarIcon
                    viewBox="0 0 618 188"
                    style={{
                      paddingLeft: "1px",
                      stroke: "black",
                      strokeWidth: "5px",
                      color:
                        constructorColors[
                          tooltipState.selectedDriver.Constructor.constructorId
                        ],
                    }}
                  />
                  <Typography variant="h6" fontWeight={800}>
                    {tooltipState.selectedDriver.Constructor.name}
                  </Typography>
                </Stack>
                <Typography variant="overline">Constructor Details</Typography>
                <Typography variant="body1">
                  <span
                    class={`fi fi-${countryFromNationality(
                      tooltipState.selectedDriver.Constructor.nationality
                    ).alpha_2_code.toLowerCase()} fib`}
                    style={{ border: "1px solid black" }}
                  ></span>{" "}
                  {tooltipState.selectedDriver.Constructor.nationality}
                </Typography>
              </Box>
            )}
          </Paper>
        </motion.div>
      </>
    );
  }
}

export default Race;
