export const roundDecimals = (x: number, ndec: number) => {
  return (Math.round(x * Math.pow(10, ndec)) / Math.pow(10, ndec)).toFixed(
    ndec
  );
};
export const floatToChar = (x: number, ndec: number): string => {
  return roundDecimals(x, ndec).toString();
};

export const prettyTimePeriod = function (dtsec: number) {
  var strout = '';
  if (Math.abs(dtsec) < 60) {
    strout = floatToChar(dtsec, 0) + ' sec';
  } else if (Math.abs(dtsec) < 60 * 60) {
    strout = floatToChar(dtsec / 60, 0) + ' min';
  } else if (Math.abs(dtsec) < 60 * 60 * 24) {
    const hrs = dtsec / (60 * 60);
    strout = floatToChar(hrs, 0) + ` hr${hrs > 1 ? 's' : ''}`;
  } else {
    const days = dtsec / (60 * 60 * 24);
    strout = floatToChar(days, 0) + ` day${days > 1 ? 's' : ''}`;
  }

  return strout;
};
