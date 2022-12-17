/**
 * Calculate age at the race from YYYY-MM-DD
 * Modified from https://www.delftstack.com/howto/javascript/calculate-age-given-the-birth-date-in-javascript/
 * @param dob Date of Birth
 * @returns (Number) Age
 */

export function calculateAge(dob, raceDate) {
  const ageDifMs = new Date(raceDate).getTime() - new Date(dob).getTime();
  const ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

/**
 * Calculate the time to the leader
 * @param leaderTime (Number) Time of the leader in seconds
 * @param time (Number) Time of the driver
 * @returns (Number) Number of seconds to leader
 */

export function calcTimeToLeader(leaderTime, time) {
  return Math.round((time - leaderTime + Number.EPSILON) * 1000) / 1000;
}

/**
 * Converts minute:seconds.mili to seconds at racing precision.
 * Credit Liam Kavanagh for a better fix to a rounding issue
 * @param time (String) The racing time
 * @returns (Number) Total number of seconds
 */
export function parseTime(time) {
  return (
    parseInt(time.slice(0, time.indexOf(":"))) * 60 +
    parseInt(time.slice(time.indexOf(":") + 1, time.indexOf("."))) +
    parseInt(time.slice(time.indexOf(".") + 1)) * 1e-3
  );
}

/**
 * Converts a time in seconds.miliseconds to a string minute:seconds.mili.
 * @param time (Number) The racing time
 * @returns (String) Total number of seconds
 */

export function timeToString(time) {
  const timeString = time + "";
  let numMili = "000";
  if (timeString.includes(".")) {
    numMili = timeString.slice(timeString.indexOf(".") + 1);
    for (let i = numMili.length; i < 3; i++) {
      numMili += "0";
    }
  }

  const numSeconds = Math.trunc(time % 60);
  let numMinutes = Math.trunc(time / 60);
  if (numMinutes > 60) {
    const numHours = Math.trunc(numMinutes / 60);
    numMinutes = numMinutes - numHours * 60;
    return numHours + ":" + numMinutes + ":" + numSeconds + "." + numMili;
  }
  if (numMinutes > 0) {
    return numMinutes + ":" + numSeconds + "." + numMili;
  } else {
    return numSeconds + "." + numMili;
  }
}

export default parseTime;
