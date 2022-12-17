/**
 * Generates a list of years from the passed in year to the current year
 * @param startYear (Number) The year to start the list from. Example: 2015
 * @returns ([Number]) List of the from startYear -> currentYear
 */
function generateYearList(startYear) {
  const currentYear = new Date().getFullYear(),
    years = [];
  while (startYear <= currentYear) {
    years.push(startYear++);
  }
  return years;
}

export default generateYearList;
