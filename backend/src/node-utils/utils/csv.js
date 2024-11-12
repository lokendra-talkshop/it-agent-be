import { parse } from 'csv-parse';

export const parse_csv = async (data) =>
  new Promise((resolve) => {
    parse(data, { columns: true }, (err, records) => {
      if (err) {
        resolve(null);
      } else {
        resolve(records);
      }
    });
  });
