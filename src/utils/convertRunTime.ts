export const convertRunTime = (totalMinutes: number) => {
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  return `${padTo2Digits(hours)}h ${padTo2Digits(minutes)}m`;
}

function padTo2Digits(num: number) {
  return num.toString().padStart(2, '0');
}