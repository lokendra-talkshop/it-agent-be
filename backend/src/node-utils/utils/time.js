export const formatDate = (date) => {
  const month = date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : `${date.getMonth() + 1}`;
  const day = date.getDate() < 10 ? `0${date.getDate()}` : `${date.getDate()}`;
  return `${date.getFullYear()}-${month}-${day}`;
};

export class TimeUtils {
  static getUnixTimeStampInSecs(delayInMinutes = 0, delayInHours = 0, delayInDays = 0) {
    return (
      Math.floor(Date.now() / 1000) +
      this.convertMinsToSecs(delayInMinutes) +
      this.convertMinsToSecs(this.convertHrsToMins(delayInHours)) +
      this.convertMinsToSecs(this.convertHrsToMins(this.convertDaysToHrs(delayInDays)))
    );
  }

  static convertMinsToSecs(mins = 0) {
    return mins * 60;
  }

  static convertHrsToMins(hrs = 0) {
    return hrs * 60;
  }

  static convertDaysToHrs(days = 0) {
    return days * 24;
  }
}

export const delay = async (ms = 30) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
