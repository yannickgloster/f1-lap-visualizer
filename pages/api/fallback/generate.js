import axios from "axios";

export default async function handler(req, res) {
  if (
    req.headers.host === "localhost:3000" ||
    req.headers.host === "0.0.0.0:3000"
  ) {
    const years = [2021, 2022];

    let fallback = {};

    for (let i = 0; i < years.length; i++) {
      const year = years[i];
      const roundReq = await axios.get(
        `${process.env.NEXT_PUBLIC_ERGAST_BASE}/${year}.json`
      );

      const rounds = roundReq.data.MRData.RaceTable.Races.map((race) => {
        return {
          round: race.round,
          raceName: race.raceName,
        };
      });

      let roundOut = [];

      for (let j = 0; j < 2; j++) {
        const round = rounds[j];

        const results = await axios.get(
          `${process.env.NEXT_PUBLIC_ERGAST_BASE}/${year}/${
            round.round
          }/results.json?limit=${20 * 100}`
        );

        const lapData = await axios.get(
          `${process.env.NEXT_PUBLIC_ERGAST_BASE}/${year}/${
            round.round
          }/laps.json?limit=${20 * 100}`
        );

        const constructors = await axios.get(
          `${process.env.NEXT_PUBLIC_ERGAST_BASE}/${year}/${
            round.round
          }/constructors.json?limit=${20 * 100}`
        );

        roundOut.push({
          year: year,
          round: round,
          data: {
            results: results.data,
            lapData: lapData.data,
            constructors: constructors.data,
          },
        });
      }

      fallback[year] = roundOut;
    }

    res.status(200).json(fallback);
  } else {
    res.status(500).send("You must be on localhost for this.");
  }
}
