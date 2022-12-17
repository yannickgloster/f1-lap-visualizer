import apiFallback from "../../../helpers/apiFallback";

export default async function handler(req, res) {
  const { fallback } = req.query;

  // Remove .json?limit...
  if (fallback[fallback.length - 1].indexOf(".") != -1) {
    fallback[fallback.length - 1] = fallback[fallback.length - 1].substr(
      0,
      fallback[fallback.length - 1].indexOf(".")
    );
  }

  const year = parseInt(fallback[0]);

  if (fallback.length > 1) {
    const roundNum = parseInt(fallback[1]);
    const dataType = fallback[2];
    const round = apiFallback[year].filter(
      (r) => parseInt(r.round.round) == roundNum
    )[0];
    let resp = round;
    switch (dataType) {
      case "results":
        resp = round.data["results"];
        break;
      case "laps":
        resp = round.data["lapData"];
        break;
      case "constructors":
        resp = round.data["constructors"];
        break;
    }
    res.status(200).json(resp);
  } else {
    const rounds = apiFallback[year].map((years) => years.round);
    res.status(200).json({ MRData: { RaceTable: { Races: rounds } } });
  }
}
