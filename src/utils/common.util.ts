import { COMMON_CONSTANT } from '@n-constants';

export function makePaginationResponse(
  data: any,
  page: number,
  pageSize: number,
  total: number,
) {
  if (pageSize) {
    const limit = pageSize || COMMON_CONSTANT.DEFAULT_PAGE_SIZE;

    return {
      page: page || COMMON_CONSTANT.DEFAULT_PAGE,
      pageSize: limit,
      totalPage: Math.ceil(total / limit),
      total,
      data,
    };
  }
  return {
    page: COMMON_CONSTANT.DEFAULT_PAGE,
    pageSize: 0,
    totalPage: 1,
    total,
    data,
  };
}

export const allRecordsCondition = {
  OR: [
    { isActive: true },
    { isActive: false },
  ],
};

export type Conversation = {
  system: string;
  user?: string;
};

export const OPENAI_MODEL = {
  GPT_4O_MINI: 'gpt-4o-mini',
  GPT_4O: 'gpt-4o',
  GPT_4: 'gpt-4',
  GPT_3_5_TURBO: 'gpt-3.5-turbo',
};

export function uuidv4(length: number = 32) {
  var d = new Date().getTime();// Timestamp
  var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0;// Time in microseconds since page-load or 0 if unsupported
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    var r = Math.random() * 16;// random number between 0 and 16
    if (d > 0) { // Use timestamp until depleted
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else { // Use microseconds since page-load if supported
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
  return uuid.slice(0, length);
}
export const withTrashedCondition = { isActive: false };
