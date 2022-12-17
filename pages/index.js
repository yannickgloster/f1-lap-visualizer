import * as React from "react";
import axios from "axios";

import {
  Button,
  Autocomplete,
  TextField,
  Box,
  Typography,
  Grid,
  Container,
  Snackbar,
  Alert,
  Stack,
  Link,
} from "@mui/material";

import { red, green, grey } from "@mui/material/colors";

import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";

import Race from "../components/race";

import generateYearList from "../helpers/generateYearList";
import parseTime from "../helpers/time";

import { APIStatus } from "../helpers/constants";

export default function Home() {
  const [error, setError] = React.useState({ text: "", enabled: false });

  const [apiInfo, setApiInfo] = React.useState({
    status: APIStatus.unknown,
    time: new Date().toLocaleTimeString(),
  });

  const [APIBase, setAPIBase] = React.useState(
    process.env.NEXT_PUBLIC_ERGAST_BASE
  );

  const [rounds, setRounds] = React.useState([]);
  const [inputRound, setInputRound] = React.useState("");
  const [round, setRound] = React.useState();
  const [lap, setLap] = React.useState(0);

  const [playingRace, setPlayingRace] = React.useState(false);

  const [data, setData] = React.useState();
  const [numLaps, setNumLaps] = React.useState(0);

  const [years, setYears] = React.useState([]);
  const [inputYear, setInputYear] = React.useState("");
  const [year, setYear] = React.useState();

  const onYearSelect = (event, updatedYear) => {
    setYear(updatedYear);
    if (updatedYear != null) {
      axios
        .get(`${APIBase}/${updatedYear}.json`)
        .then((result) => {
          let date = new Date();
          date = date.setDate(date.getDate() + 1);
          const updatedRounds = result.data.MRData.RaceTable.Races.map(
            (race) => {
              const raceDate = new Date(race.date);

              if (date > raceDate) {
                return {
                  id: race.round,
                  label: race.raceName,
                };
              }
            }
          ).filter((round) => round !== undefined);
          setRounds(updatedRounds);

          if (round) {
            const sameRound = updatedRounds.filter(
              (r) => r.label == round.label
            );
            if (sameRound.length > 0) {
              setRound(sameRound[0]);
            } else {
              setRound();
            }
          } else {
            setRound();
          }
        })
        .catch((error) => {
          console.log(error);
          switchToFallbackData();
        });
    } else {
      setRounds([]);
    }
  };

  const onRoundSelect = (event, updatedRound) => {
    setRound(updatedRound);
  };

  const changeLap = (event) => {
    const num = parseInt(event.target.value);
    if (num < 0 || isNaN(num)) {
      setLap(0);
    } else if (num >= numLaps) {
      setLap(numLaps - 1);
    } else if (num < numLaps) {
      setLap(num);
    } else {
      setLap(numLaps - 1);
    }
  };

  const showMeTheRace = () => {
    let newData = {};
    if (year && round) {
      axios
        .get(`${APIBase}/${year}/${round.id}/results.json?limit=30`)
        .then((resp) => {
          newData = { ...newData, results: resp.data };

          const numLaps = parseInt(
            resp.data.MRData.RaceTable.Races[0].Results[0].laps
          );

          setPlayingRace(false);
          setLap(0);
          setNumLaps(numLaps + 1);

          const numDrivers = resp.data.MRData.RaceTable.Races[0].Results.length;

          return axios.all([
            axios.get(
              `${APIBase}/${year}/${round.id}/laps.json?limit=${
                numLaps * numDrivers
              }`
            ),
            axios.get(
              `${APIBase}/${year}/${round.id}/constructors.json?limit=${
                numDrivers / 2
              }`
            ),
          ]);
        })
        .then(
          axios.spread((respLap, respConsts) => {
            const numberOfLaps =
              respLap.data.MRData.RaceTable.Races[0].Laps.length;
            for (let i = 0; i < numberOfLaps; i++) {
              const lapDetails = respLap.data.MRData.RaceTable.Races[0].Laps[i];
              let previousLap;
              if (i != 0) {
                previousLap =
                  respLap.data.MRData.RaceTable.Races[0].Laps[i - 1];
              }
              for (let j = 0; j < lapDetails.Timings.length; j++) {
                respLap.data.MRData.RaceTable.Races[0].Laps[i].Timings[
                  j
                ].totalTime = parseTime(lapDetails.Timings[j].time);
                if (i != 0) {
                  const prevLap = previousLap.Timings.filter(
                    (lap) => lap.driverId == lapDetails.Timings[j].driverId
                  );
                  respLap.data.MRData.RaceTable.Races[0].Laps[i].Timings[
                    j
                  ].totalTime += prevLap[0].totalTime;
                }
              }
            }

            const startGrid =
              newData.results.MRData.RaceTable.Races[0].Results.sort((a, b) => {
                a.grid = parseInt(a.grid);
                b.grid = parseInt(b.grid);
                // A grid position of 0 indicates that the car started from the pitlane
                if (a.grid == 0) {
                  a.grid = Number.MAX_SAFE_INTEGER;
                }
                if (b.grid == 0) {
                  b.grid = Number.MAX_SAFE_INTEGER;
                }
                return a.grid - b.grid;
              });

            const timings = startGrid
              .map((result, index) => {
                if (result.positionText != "F") {
                  return {
                    driverId: result.Driver.driverId,
                    position: result.grid,
                    time: "0.0",
                    // Distance betwen grid spots is 8m
                    // With an average ~11.1m/s² acceleration up to 100km/h (Wikipedia) it would take about √2*(8m)/(11.1 m/s²) ≈ 1.2 seconds to cover 8m
                    totalTime: index * 1.2,
                  };
                }
              })
              .filter((timing) => timing !== undefined);

            respLap.data.MRData.RaceTable.Races[0].Laps.unshift({
              number: 0,
              Timings: timings,
            });

            newData = {
              ...newData,
              lapData: respLap.data,
              constructorData: respConsts.data,
            };
            setData(newData);
          })
        )
        .catch((error) => {
          console.log(error);
          switchToFallbackData();
        });
    } else {
      switchToFallbackData();
    }
  };

  const handleCloseError = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setError({ text: "", enabled: false });
  };

  const checkAPIStatus = () => {
    axios
      .get(`${APIBase}/seasons.json`)
      .then((test) => {
        setApiInfo({
          status: APIStatus.online,
          time: new Date().toLocaleTimeString(),
        });
        setYears(generateYearList(1996).map(String));
      })
      .catch((error) => {
        console.log(error);
        switchToFallbackData();
      });
  };

  const switchToFallbackData = () => {
    setYear();
    setRound();
    setRounds([]);
    setAPIBase("/api/fallback");
    setYears([2021, 2022]);
    setError({
      text: "Ergast Developer API offline, using fallback data.",
      enabled: true,
    });
    setApiInfo({
      status: APIStatus.offline,
      time: new Date().toLocaleTimeString(),
    });
  };

  const getAPIStatusColor = () => {
    switch (apiInfo.status) {
      case APIStatus.unknown:
        return grey[300];
      case APIStatus.offline:
        return red[500];
      case APIStatus.online:
        return green[500];
    }
  };

  React.useEffect(() => {
    const player = () => {
      setLap(parseInt(lap) + 1);
    };

    if (lap >= numLaps - 1 || !playingRace) {
      setPlayingRace(false);
      return;
    }

    const id = setInterval(player, 1000);
    return () => clearInterval(id);
  }, [lap, playingRace]);

  React.useEffect(() => {
    checkAPIStatus();
  }, []);

  return (
    <Container maxWidth="xl">
      <Stack direction="row" alignItems="baseline" gap={1}>
        <Typography variant="h4" fontWeight={800}>
          Formula 1 Race Visualizer
        </Typography>
        <Typography variant="subtitle2" display="block">
          Built by{" "}
          <Link
            href="https://github.com/yannickgloster"
            underline="hover"
            target="_blank"
          >
            Yannick Gloster
          </Link>
        </Typography>
      </Stack>
      <Stack direction="row" alignItems="center" gap={1}>
        <Typography variant="body2">Ergast API Status:</Typography>
        <RadioButtonCheckedIcon
          sx={{ color: getAPIStatusColor() }}
          fontSize="small"
        />
        {apiInfo.status != APIStatus.unknown && (
          <Typography variant="body2">Checked at: {apiInfo.time}</Typography>
        )}
      </Stack>
      <Typography variant="body1">
        The Formula 1 Race visualizer is an unofficial visualizer of races from
        1996 onwards. The site will update with the latest races after they
        happen.
      </Typography>
      <Typography variant="body1">
        Once you select a year and a round, you can select a lap or click play
        to see how the gap to the leader evolved over time.
      </Typography>
      <Typography variant="body1" paragraph={true}>
        You can click or hover over a driver for additional driver, constructor,
        and race information.
      </Typography>
      <Typography variant="body1" paragraph={true}>
        Powered by the{" "}
        <Link href="http://ergast.com/mr" underline="hover" target="_blank">
          Ergast API
        </Link>
        .
      </Typography>
      <Typography variant="body2" fontStyle={"italic"}>
        In the case of any error, refresh the page.
      </Typography>
      <Typography variant="body2" fontStyle={"italic"}>
        In the case of the Ergast API becoming unavailable, the page will revert
        to backup data.
      </Typography>
      <Typography variant="body2" fontStyle={"italic"}>
        Viewing on mobile devices my cause strange behavior and is discouraged.
      </Typography>
      <Grid container spacing={2} direction="row" mb={2} mt={2}>
        <Grid item>
          <Autocomplete
            disablePortal
            options={years}
            value={year || null}
            onChange={onYearSelect}
            inputValue={inputYear}
            onInputChange={(_, newInputValue) => {
              setInputYear(newInputValue);
            }}
            sx={{ width: 300 }}
            renderInput={(params) => <TextField {...params} label="Year" />}
          />
        </Grid>
        <Grid item>
          <Autocomplete
            disablePortal
            options={rounds}
            value={round || null}
            onChange={onRoundSelect}
            inputValue={inputRound}
            onInputChange={(_, newInputValue) => {
              setInputRound(newInputValue);
            }}
            sx={{ width: 300 }}
            renderInput={(params) => <TextField {...params} label="Round" />}
          />
        </Grid>
      </Grid>
      <Button
        variant="contained"
        onClick={showMeTheRace}
        disabled={!round || !year}
      >
        Load Race
      </Button>
      {/* TODO: Remove break point */}
      <br />
      <br />
      {data && (
        <>
          <Box pb={2}>
            <TextField
              label="Lap"
              type="number"
              value={lap}
              onChange={changeLap}
              InputLabelProps={{
                shrink: true,
              }}
              helperText={lap == 0 ? "Starting Grid" : "Race"}
            />
          </Box>
          <Box>
            <Button
              variant="outlined"
              startIcon={playingRace ? <PauseIcon /> : <PlayArrowIcon />}
              onClick={() => {
                setPlayingRace(!playingRace);
              }}
            >
              {playingRace ? "Pause" : "Play"} Race
            </Button>
          </Box>
          <Box pt={4}>
            <Race
              data={data}
              lap={lap}
              width={300}
              height={80}
              numLaps={numLaps}
            />
          </Box>
        </>
      )}
      <Snackbar
        open={error.enabled}
        autoHideDuration={6000}
        onClose={handleCloseError}
      >
        <Alert
          onClose={handleCloseError}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error.text}
        </Alert>
      </Snackbar>
    </Container>
  );
}
