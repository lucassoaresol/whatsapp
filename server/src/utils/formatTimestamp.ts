import dayLib from '../libs/dayjs';

export function formatTimestamp(timestamp: number) {
  const dateDay = dayLib(timestamp * 1000);
  const today = dayLib().startOf('day');
  const dateOnly = dateDay.startOf('day');

  const days = today.diff(dateOnly, 'day');
  let dateDisplay = dateDay.format('DD/MM/YYYY');

  if (days === 0) {
    dateDisplay = dateDay.format('HH:mm');
  }

  if (days === 1) {
    dateDisplay = 'Ontem';
  }

  if (days > 1 && days <= 6) {
    dateDisplay = dateDay.format('dddd');
  }

  return {
    date: dateDay.format('YYYY-MM-DD HH:mm:ss.SSS'),
    date_display: dateDisplay,
    hour: dateDay.format('HH:mm'),
  };
}
