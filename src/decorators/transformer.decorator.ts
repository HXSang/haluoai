import { Transform } from 'class-transformer';
import moment from 'moment';

export function TransformToArrayOfNumbers() {
  return Transform(({ value }) => {
    // Check if value is an array and map each element to a number
    if (Array.isArray(value)) {
      return value.map(Number);
    }
    // If value is not an array, convert it to a number and wrap it in an array
    return [Number(value)];
  });
}

export function TransformToAnyArray() {
  return Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value;
    }
    return [value];
  });
}

export function TransformRemark() {
  return Transform(({ value }) => {
    if (value && typeof value === 'string') {
      const valueStr = value as string;
      return valueStr.trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
    }
    return value;
  });
}

export function TransformTimeToDate() {
  return Transform(({ value }) => {
    let dateTime: moment.Moment;
    dateTime = moment(value, 'HH:mm');
    if (dateTime.isValid()) {
      return new Date(`1970-01-01T${value}:00.000Z`);
    }

    dateTime = moment(value, 'HH:mm:ss');
    if (dateTime.isValid()) {
      return new Date(`1970-01-01T${value}.000Z`);
    }

    return value;
  });
}

export function TransformToBoolean(options?: { each: boolean }) {
  const convert = (v: any) => {
    if (v === 'true') return true;
    if (v === 'false') return false;
    return v;
  };

  return Transform(({ value }) => {
    if (options?.each && Array.isArray(value)) {
      return value.map(convert);
    } if (options?.each) {
      return [convert(value)];
    }
    return convert(value);
  });
}
