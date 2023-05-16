import moment from 'moment';

export const formatDate = (date, format) => {
  return moment(date).format(format);
};

export const isOverlaped = (from, to, nextFrom, nextTo) => {
  const fromDate = moment(from);
  const toDate = moment(to);
  const nextFromDate = moment(nextFrom);
  const nextToDate = moment(nextTo);
  if (fromDate.isBefore(nextFromDate) && toDate.isSameOrBefore(nextFromDate))
    return false;

  if (fromDate.isSameOrAfter(nextToDate) && toDate.isSameOrAfter(nextToDate))
    return false;

  return true;
};
