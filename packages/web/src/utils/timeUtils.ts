/**
 * Конвертирует локальную дату/время клиента в строку в UTC (ISO)
 */
export function toServerTime(clientDate: Date | string): string {
  const date = typeof clientDate === "string" ? new Date(clientDate) : clientDate;
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
}

/**
 * Конвертирует дату/время в UTC (от сервера) в объект Date в локальном времени
 */
export function toClientTime(serverDate: Date | string): Date {
  return new Date(serverDate); // JS автоматически интерпретирует UTC как локальное время
}
