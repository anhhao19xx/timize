import dateFormat from "dateformat";
import moment from moment;

export function formatDate(){
  return dateFormat(d, 'DDDD');
}