export const formatDate = (date) => {
  if (!date) return "Date TBD"

  return new Date(date).toLocaleDateString()
}

export const formatTime = (time) => {
  if (!time) return "Time TBD"

  const [hourValue, minuteValue] = time.split(":").map(Number)

  if (
    Number.isNaN(hourValue) ||
    Number.isNaN(minuteValue) ||
    hourValue < 0 ||
    hourValue > 23 ||
    minuteValue < 0 ||
    minuteValue > 59
  ) {
    return time
  }

  const timeDate = new Date()
  timeDate.setHours(hourValue, minuteValue, 0, 0)

  return timeDate.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })
}

export const formatEventDateTime = (date, time) => {
  return `${formatDate(date)} | ${formatTime(time)}`
}
