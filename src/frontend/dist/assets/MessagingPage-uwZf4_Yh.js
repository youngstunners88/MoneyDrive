import { c as createLucideIcon, u as useActor, m as useQuery, n as useQueryClient, o as useMutation, p as ue, r as reactExports, j as jsxRuntimeExports, l as MessageCircle, i as Badge, v as Card, W as WifiOff, w as Settings, x as CardHeader, y as CardTitle, z as Shield, D as ChevronUp, s as ChevronDown, E as CardContent, F as Label, I as Input, G as EyeOff, J as Eye, B as Button, K as Copy, R as RefreshCw, N as Check, O as Smartphone, Q as Phone, U as ArrowRight, q as Skeleton, V as MessageSquare, Z as Zap, X, Y as Clock } from "./index-C-RLbQrs.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M18 6 7 17l-5-5", key: "116fxf" }],
  ["path", { d: "m22 10-7.5 7.5L13 16", key: "ke71qq" }]
];
const CheckCheck = createLucideIcon("check-check", __iconNode);
function toDate(argument) {
  const argStr = Object.prototype.toString.call(argument);
  if (argument instanceof Date || typeof argument === "object" && argStr === "[object Date]") {
    return new argument.constructor(+argument);
  } else if (typeof argument === "number" || argStr === "[object Number]" || typeof argument === "string" || argStr === "[object String]") {
    return new Date(argument);
  } else {
    return /* @__PURE__ */ new Date(NaN);
  }
}
function constructFrom(date, value) {
  if (date instanceof Date) {
    return new date.constructor(value);
  } else {
    return new Date(value);
  }
}
const minutesInMonth = 43200;
const minutesInDay = 1440;
let defaultOptions = {};
function getDefaultOptions() {
  return defaultOptions;
}
function getTimezoneOffsetInMilliseconds(date) {
  const _date = toDate(date);
  const utcDate = new Date(
    Date.UTC(
      _date.getFullYear(),
      _date.getMonth(),
      _date.getDate(),
      _date.getHours(),
      _date.getMinutes(),
      _date.getSeconds(),
      _date.getMilliseconds()
    )
  );
  utcDate.setUTCFullYear(_date.getFullYear());
  return +date - +utcDate;
}
function compareAsc(dateLeft, dateRight) {
  const _dateLeft = toDate(dateLeft);
  const _dateRight = toDate(dateRight);
  const diff = _dateLeft.getTime() - _dateRight.getTime();
  if (diff < 0) {
    return -1;
  } else if (diff > 0) {
    return 1;
  } else {
    return diff;
  }
}
function constructNow(date) {
  return constructFrom(date, Date.now());
}
function differenceInCalendarMonths(dateLeft, dateRight) {
  const _dateLeft = toDate(dateLeft);
  const _dateRight = toDate(dateRight);
  const yearDiff = _dateLeft.getFullYear() - _dateRight.getFullYear();
  const monthDiff = _dateLeft.getMonth() - _dateRight.getMonth();
  return yearDiff * 12 + monthDiff;
}
function getRoundingMethod(method) {
  return (number) => {
    const round = method ? Math[method] : Math.trunc;
    const result = round(number);
    return result === 0 ? 0 : result;
  };
}
function differenceInMilliseconds(dateLeft, dateRight) {
  return +toDate(dateLeft) - +toDate(dateRight);
}
function endOfDay(date) {
  const _date = toDate(date);
  _date.setHours(23, 59, 59, 999);
  return _date;
}
function endOfMonth(date) {
  const _date = toDate(date);
  const month = _date.getMonth();
  _date.setFullYear(_date.getFullYear(), month + 1, 0);
  _date.setHours(23, 59, 59, 999);
  return _date;
}
function isLastDayOfMonth(date) {
  const _date = toDate(date);
  return +endOfDay(_date) === +endOfMonth(_date);
}
function differenceInMonths(dateLeft, dateRight) {
  const _dateLeft = toDate(dateLeft);
  const _dateRight = toDate(dateRight);
  const sign = compareAsc(_dateLeft, _dateRight);
  const difference = Math.abs(
    differenceInCalendarMonths(_dateLeft, _dateRight)
  );
  let result;
  if (difference < 1) {
    result = 0;
  } else {
    if (_dateLeft.getMonth() === 1 && _dateLeft.getDate() > 27) {
      _dateLeft.setDate(30);
    }
    _dateLeft.setMonth(_dateLeft.getMonth() - sign * difference);
    let isLastMonthNotFull = compareAsc(_dateLeft, _dateRight) === -sign;
    if (isLastDayOfMonth(toDate(dateLeft)) && difference === 1 && compareAsc(dateLeft, _dateRight) === 1) {
      isLastMonthNotFull = false;
    }
    result = sign * (difference - Number(isLastMonthNotFull));
  }
  return result === 0 ? 0 : result;
}
function differenceInSeconds(dateLeft, dateRight, options) {
  const diff = differenceInMilliseconds(dateLeft, dateRight) / 1e3;
  return getRoundingMethod(options == null ? void 0 : options.roundingMethod)(diff);
}
const formatDistanceLocale = {
  lessThanXSeconds: {
    one: "less than a second",
    other: "less than {{count}} seconds"
  },
  xSeconds: {
    one: "1 second",
    other: "{{count}} seconds"
  },
  halfAMinute: "half a minute",
  lessThanXMinutes: {
    one: "less than a minute",
    other: "less than {{count}} minutes"
  },
  xMinutes: {
    one: "1 minute",
    other: "{{count}} minutes"
  },
  aboutXHours: {
    one: "about 1 hour",
    other: "about {{count}} hours"
  },
  xHours: {
    one: "1 hour",
    other: "{{count}} hours"
  },
  xDays: {
    one: "1 day",
    other: "{{count}} days"
  },
  aboutXWeeks: {
    one: "about 1 week",
    other: "about {{count}} weeks"
  },
  xWeeks: {
    one: "1 week",
    other: "{{count}} weeks"
  },
  aboutXMonths: {
    one: "about 1 month",
    other: "about {{count}} months"
  },
  xMonths: {
    one: "1 month",
    other: "{{count}} months"
  },
  aboutXYears: {
    one: "about 1 year",
    other: "about {{count}} years"
  },
  xYears: {
    one: "1 year",
    other: "{{count}} years"
  },
  overXYears: {
    one: "over 1 year",
    other: "over {{count}} years"
  },
  almostXYears: {
    one: "almost 1 year",
    other: "almost {{count}} years"
  }
};
const formatDistance$1 = (token, count, options) => {
  let result;
  const tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") {
    result = tokenValue;
  } else if (count === 1) {
    result = tokenValue.one;
  } else {
    result = tokenValue.other.replace("{{count}}", count.toString());
  }
  if (options == null ? void 0 : options.addSuffix) {
    if (options.comparison && options.comparison > 0) {
      return "in " + result;
    } else {
      return result + " ago";
    }
  }
  return result;
};
function buildFormatLongFn(args) {
  return (options = {}) => {
    const width = options.width ? String(options.width) : args.defaultWidth;
    const format = args.formats[width] || args.formats[args.defaultWidth];
    return format;
  };
}
const dateFormats = {
  full: "EEEE, MMMM do, y",
  long: "MMMM do, y",
  medium: "MMM d, y",
  short: "MM/dd/yyyy"
};
const timeFormats = {
  full: "h:mm:ss a zzzz",
  long: "h:mm:ss a z",
  medium: "h:mm:ss a",
  short: "h:mm a"
};
const dateTimeFormats = {
  full: "{{date}} 'at' {{time}}",
  long: "{{date}} 'at' {{time}}",
  medium: "{{date}}, {{time}}",
  short: "{{date}}, {{time}}"
};
const formatLong = {
  date: buildFormatLongFn({
    formats: dateFormats,
    defaultWidth: "full"
  }),
  time: buildFormatLongFn({
    formats: timeFormats,
    defaultWidth: "full"
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats,
    defaultWidth: "full"
  })
};
const formatRelativeLocale = {
  lastWeek: "'last' eeee 'at' p",
  yesterday: "'yesterday at' p",
  today: "'today at' p",
  tomorrow: "'tomorrow at' p",
  nextWeek: "eeee 'at' p",
  other: "P"
};
const formatRelative = (token, _date, _baseDate, _options) => formatRelativeLocale[token];
function buildLocalizeFn(args) {
  return (value, options) => {
    const context = (options == null ? void 0 : options.context) ? String(options.context) : "standalone";
    let valuesArray;
    if (context === "formatting" && args.formattingValues) {
      const defaultWidth = args.defaultFormattingWidth || args.defaultWidth;
      const width = (options == null ? void 0 : options.width) ? String(options.width) : defaultWidth;
      valuesArray = args.formattingValues[width] || args.formattingValues[defaultWidth];
    } else {
      const defaultWidth = args.defaultWidth;
      const width = (options == null ? void 0 : options.width) ? String(options.width) : args.defaultWidth;
      valuesArray = args.values[width] || args.values[defaultWidth];
    }
    const index = args.argumentCallback ? args.argumentCallback(value) : value;
    return valuesArray[index];
  };
}
const eraValues = {
  narrow: ["B", "A"],
  abbreviated: ["BC", "AD"],
  wide: ["Before Christ", "Anno Domini"]
};
const quarterValues = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["Q1", "Q2", "Q3", "Q4"],
  wide: ["1st quarter", "2nd quarter", "3rd quarter", "4th quarter"]
};
const monthValues = {
  narrow: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
  abbreviated: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ],
  wide: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ]
};
const dayValues = {
  narrow: ["S", "M", "T", "W", "T", "F", "S"],
  short: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  abbreviated: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  wide: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ]
};
const dayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  }
};
const formattingDayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  }
};
const ordinalNumber = (dirtyNumber, _options) => {
  const number = Number(dirtyNumber);
  const rem100 = number % 100;
  if (rem100 > 20 || rem100 < 10) {
    switch (rem100 % 10) {
      case 1:
        return number + "st";
      case 2:
        return number + "nd";
      case 3:
        return number + "rd";
    }
  }
  return number + "th";
};
const localize = {
  ordinalNumber,
  era: buildLocalizeFn({
    values: eraValues,
    defaultWidth: "wide"
  }),
  quarter: buildLocalizeFn({
    values: quarterValues,
    defaultWidth: "wide",
    argumentCallback: (quarter) => quarter - 1
  }),
  month: buildLocalizeFn({
    values: monthValues,
    defaultWidth: "wide"
  }),
  day: buildLocalizeFn({
    values: dayValues,
    defaultWidth: "wide"
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues,
    defaultWidth: "wide",
    formattingValues: formattingDayPeriodValues,
    defaultFormattingWidth: "wide"
  })
};
function buildMatchFn(args) {
  return (string, options = {}) => {
    const width = options.width;
    const matchPattern = width && args.matchPatterns[width] || args.matchPatterns[args.defaultMatchWidth];
    const matchResult = string.match(matchPattern);
    if (!matchResult) {
      return null;
    }
    const matchedString = matchResult[0];
    const parsePatterns = width && args.parsePatterns[width] || args.parsePatterns[args.defaultParseWidth];
    const key = Array.isArray(parsePatterns) ? findIndex(parsePatterns, (pattern) => pattern.test(matchedString)) : (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- I challange you to fix the type
      findKey(parsePatterns, (pattern) => pattern.test(matchedString))
    );
    let value;
    value = args.valueCallback ? args.valueCallback(key) : key;
    value = options.valueCallback ? (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- I challange you to fix the type
      options.valueCallback(value)
    ) : value;
    const rest = string.slice(matchedString.length);
    return { value, rest };
  };
}
function findKey(object, predicate) {
  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key) && predicate(object[key])) {
      return key;
    }
  }
  return void 0;
}
function findIndex(array, predicate) {
  for (let key = 0; key < array.length; key++) {
    if (predicate(array[key])) {
      return key;
    }
  }
  return void 0;
}
function buildMatchPatternFn(args) {
  return (string, options = {}) => {
    const matchResult = string.match(args.matchPattern);
    if (!matchResult) return null;
    const matchedString = matchResult[0];
    const parseResult = string.match(args.parsePattern);
    if (!parseResult) return null;
    let value = args.valueCallback ? args.valueCallback(parseResult[0]) : parseResult[0];
    value = options.valueCallback ? options.valueCallback(value) : value;
    const rest = string.slice(matchedString.length);
    return { value, rest };
  };
}
const matchOrdinalNumberPattern = /^(\d+)(th|st|nd|rd)?/i;
const parseOrdinalNumberPattern = /\d+/i;
const matchEraPatterns = {
  narrow: /^(b|a)/i,
  abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
  wide: /^(before christ|before common era|anno domini|common era)/i
};
const parseEraPatterns = {
  any: [/^b/i, /^(a|c)/i]
};
const matchQuarterPatterns = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234](th|st|nd|rd)? quarter/i
};
const parseQuarterPatterns = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
const matchMonthPatterns = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
  wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i
};
const parseMonthPatterns = {
  narrow: [
    /^j/i,
    /^f/i,
    /^m/i,
    /^a/i,
    /^m/i,
    /^j/i,
    /^j/i,
    /^a/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i
  ],
  any: [
    /^ja/i,
    /^f/i,
    /^mar/i,
    /^ap/i,
    /^may/i,
    /^jun/i,
    /^jul/i,
    /^au/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i
  ]
};
const matchDayPatterns = {
  narrow: /^[smtwf]/i,
  short: /^(su|mo|tu|we|th|fr|sa)/i,
  abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
  wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i
};
const parseDayPatterns = {
  narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
  any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i]
};
const matchDayPeriodPatterns = {
  narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
  any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
};
const parseDayPeriodPatterns = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^mi/i,
    noon: /^no/i,
    morning: /morning/i,
    afternoon: /afternoon/i,
    evening: /evening/i,
    night: /night/i
  }
};
const match = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern,
    parsePattern: parseOrdinalNumberPattern,
    valueCallback: (value) => parseInt(value, 10)
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseEraPatterns,
    defaultParseWidth: "any"
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseQuarterPatterns,
    defaultParseWidth: "any",
    valueCallback: (index) => index + 1
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseMonthPatterns,
    defaultParseWidth: "any"
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseDayPatterns,
    defaultParseWidth: "any"
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns,
    defaultMatchWidth: "any",
    parsePatterns: parseDayPeriodPatterns,
    defaultParseWidth: "any"
  })
};
const enUS = {
  code: "en-US",
  formatDistance: formatDistance$1,
  formatLong,
  formatRelative,
  localize,
  match,
  options: {
    weekStartsOn: 0,
    firstWeekContainsDate: 1
  }
};
function formatDistance(date, baseDate, options) {
  const defaultOptions2 = getDefaultOptions();
  const locale = (options == null ? void 0 : options.locale) ?? defaultOptions2.locale ?? enUS;
  const minutesInAlmostTwoDays = 2520;
  const comparison = compareAsc(date, baseDate);
  if (isNaN(comparison)) {
    throw new RangeError("Invalid time value");
  }
  const localizeOptions = Object.assign({}, options, {
    addSuffix: options == null ? void 0 : options.addSuffix,
    comparison
  });
  let dateLeft;
  let dateRight;
  if (comparison > 0) {
    dateLeft = toDate(baseDate);
    dateRight = toDate(date);
  } else {
    dateLeft = toDate(date);
    dateRight = toDate(baseDate);
  }
  const seconds = differenceInSeconds(dateRight, dateLeft);
  const offsetInSeconds = (getTimezoneOffsetInMilliseconds(dateRight) - getTimezoneOffsetInMilliseconds(dateLeft)) / 1e3;
  const minutes = Math.round((seconds - offsetInSeconds) / 60);
  let months;
  if (minutes < 2) {
    if (options == null ? void 0 : options.includeSeconds) {
      if (seconds < 5) {
        return locale.formatDistance("lessThanXSeconds", 5, localizeOptions);
      } else if (seconds < 10) {
        return locale.formatDistance("lessThanXSeconds", 10, localizeOptions);
      } else if (seconds < 20) {
        return locale.formatDistance("lessThanXSeconds", 20, localizeOptions);
      } else if (seconds < 40) {
        return locale.formatDistance("halfAMinute", 0, localizeOptions);
      } else if (seconds < 60) {
        return locale.formatDistance("lessThanXMinutes", 1, localizeOptions);
      } else {
        return locale.formatDistance("xMinutes", 1, localizeOptions);
      }
    } else {
      if (minutes === 0) {
        return locale.formatDistance("lessThanXMinutes", 1, localizeOptions);
      } else {
        return locale.formatDistance("xMinutes", minutes, localizeOptions);
      }
    }
  } else if (minutes < 45) {
    return locale.formatDistance("xMinutes", minutes, localizeOptions);
  } else if (minutes < 90) {
    return locale.formatDistance("aboutXHours", 1, localizeOptions);
  } else if (minutes < minutesInDay) {
    const hours = Math.round(minutes / 60);
    return locale.formatDistance("aboutXHours", hours, localizeOptions);
  } else if (minutes < minutesInAlmostTwoDays) {
    return locale.formatDistance("xDays", 1, localizeOptions);
  } else if (minutes < minutesInMonth) {
    const days = Math.round(minutes / minutesInDay);
    return locale.formatDistance("xDays", days, localizeOptions);
  } else if (minutes < minutesInMonth * 2) {
    months = Math.round(minutes / minutesInMonth);
    return locale.formatDistance("aboutXMonths", months, localizeOptions);
  }
  months = differenceInMonths(dateRight, dateLeft);
  if (months < 12) {
    const nearestMonth = Math.round(minutes / minutesInMonth);
    return locale.formatDistance("xMonths", nearestMonth, localizeOptions);
  } else {
    const monthsSinceStartOfYear = months % 12;
    const years = Math.trunc(months / 12);
    if (monthsSinceStartOfYear < 3) {
      return locale.formatDistance("aboutXYears", years, localizeOptions);
    } else if (monthsSinceStartOfYear < 9) {
      return locale.formatDistance("overXYears", years, localizeOptions);
    } else {
      return locale.formatDistance("almostXYears", years + 1, localizeOptions);
    }
  }
}
function formatDistanceToNow(date, options) {
  return formatDistance(date, constructNow(date), options);
}
const messagingKeys = {
  history: (limit) => ["whatsapp-history", limit],
  unreadCount: () => ["whatsapp-unread"],
  isConfigured: () => ["whatsapp-configured"]
};
function useWhatsAppHistory(limit) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: messagingKeys.history(limit),
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getWhatsAppHistory(
        BigInt(limit),
        null
      );
      return result;
    },
    enabled: !!actor && !isFetching,
    staleTime: 15e3
    // 15s — messages refresh frequently
  });
}
function useUnreadWhatsAppCount() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: messagingKeys.unreadCount(),
    queryFn: async () => {
      if (!actor) return 0;
      const count = await actor.getUnreadWhatsAppCount();
      return Number(count);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 3e4
    // poll every 30s
  });
}
function useIsWhatsAppConfigured() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: messagingKeys.isConfigured(),
    queryFn: async () => {
      if (!actor) return false;
      return actor.isWhatsAppConfigured();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 6e4
  });
}
function useRegisterWhatsAppPhone() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (phone) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.registerWhatsAppPhone(phone);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.history() });
      ue.success("WhatsApp number registered successfully");
    },
    onError: (err) => {
      ue.error(`Failed to register number: ${err.message}`);
    }
  });
}
function useSaveWhatsAppConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config) => {
      if (!actor) throw new Error("Actor not available");
      await actor.setWhatsAppConfig(
        config
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: messagingKeys.isConfigured()
      });
      ue.success("WhatsApp configuration saved");
    },
    onError: (err) => {
      ue.error(`Failed to save config: ${err.message}`);
    }
  });
}
const COMMANDS = [
  {
    cmd: "/leads",
    desc: "Top 10 companies to pitch this week",
    emoji: "🎯"
  },
  {
    cmd: "/coach [company]",
    desc: "Get a personalised pitch strategy",
    emoji: "🧠"
  },
  {
    cmd: "/status",
    desc: "Your earnings & deal summary",
    emoji: "📊"
  },
  {
    cmd: "/help",
    desc: "See all available commands",
    emoji: "💡"
  }
];
const STATUS_ICONS = {
  sent: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-3 h-3 text-muted-foreground" }),
  delivered: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCheck, { className: "w-3 h-3 text-muted-foreground" }),
  read: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCheck, { className: "w-3 h-3 text-primary" }),
  failed: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-3 h-3 text-destructive" })
};
const STATUS_LABEL = {
  sent: "Sent",
  delivered: "Delivered",
  read: "Read",
  failed: "Failed"
};
function MessageBubble({ entry }) {
  const isOutbound = entry.direction === "outbound";
  const ts = Number(entry.timestamp / 1000000n);
  const timeStr = formatDistanceToNow(new Date(ts), { addSuffix: true });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `flex ${isOutbound ? "justify-end" : "justify-start"} mb-3`,
      children: [
        !isOutbound && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-7 h-7 rounded-full bg-muted flex items-center justify-center mr-2 mt-1 shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "w-3.5 h-3.5 text-muted-foreground" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: `max-w-[78%] rounded-2xl px-4 py-2.5 ${isOutbound ? "bg-burnt-orange text-foreground rounded-br-sm shadow-card" : "bg-card border border-border rounded-bl-sm"}`,
            "data-ocid": "messaging.message_bubble",
            children: [
              isOutbound && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-semibold uppercase tracking-wide opacity-70 mb-1", children: "Nduna" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm leading-relaxed break-words", children: entry.body }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: `flex items-center gap-1.5 mt-1.5 ${isOutbound ? "justify-end" : "justify-start"}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] opacity-50", children: timeStr }),
                    isOutbound && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { title: STATUS_LABEL[entry.deliveryStatus], children: STATUS_ICONS[entry.deliveryStatus] })
                  ]
                }
              ),
              entry.errorMsg && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-destructive mt-1 border-t border-destructive/20 pt-1", children: [
                "⚠ ",
                entry.errorMsg
              ] })
            ]
          }
        ),
        isOutbound && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-7 h-7 rounded-full bg-burnt-orange/20 flex items-center justify-center ml-2 mt-1 shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "w-3.5 h-3.5 text-burnt-orange" }) })
      ]
    }
  );
}
function ConnectionStatusBadge({ connected }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "span",
    {
      className: `messaging-status-indicator ${connected ? "connected" : "disconnected"}`,
      children: connected ? "Connected" : "Not connected"
    }
  );
}
function AdminConfigPanel() {
  const saveConfig = useSaveWhatsAppConfig();
  const [apiKey, setApiKey] = reactExports.useState("");
  const [phone, setPhone] = reactExports.useState("");
  const [webhookSecret, setWebhookSecret] = reactExports.useState("");
  const [showApiKey, setShowApiKey] = reactExports.useState(false);
  const [showSecret, setShowSecret] = reactExports.useState(false);
  const [open, setOpen] = reactExports.useState(false);
  const webhookUrl = `https://${window.location.hostname}/whatsapp-webhook`;
  const handleSave = () => {
    if (!apiKey.trim() || !phone.trim()) {
      ue.error("API key and phone number are required");
      return;
    }
    saveConfig.mutate(
      {
        apiKey: apiKey.trim(),
        phoneNumber: phone.trim(),
        webhookSecret: webhookSecret.trim()
      },
      {
        onSuccess: () => {
          setApiKey("");
          setWebhookSecret("");
        }
      }
    );
  };
  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    ue.success("Webhook URL copied");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-border/80 shadow-card", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        className: "flex items-center justify-between w-full text-left",
        onClick: () => setOpen((v) => !v),
        "data-ocid": "messaging.admin_config.toggle",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 text-base", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "w-4 h-4 text-primary" }),
            "Admin: WhatsApp Configuration"
          ] }),
          open ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "w-4 h-4 text-muted-foreground" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "w-4 h-4 text-muted-foreground" })
        ]
      }
    ) }),
    open && /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4 pt-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground uppercase tracking-wide", children: "360dialog API Key" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              type: showApiKey ? "text" : "password",
              value: apiKey,
              onChange: (e) => setApiKey(e.target.value),
              placeholder: "••••••••••••••••",
              className: "pr-10",
              "data-ocid": "messaging.admin_config.api_key"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",
              onClick: () => setShowApiKey((v) => !v),
              children: showApiKey ? /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "w-4 h-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "w-4 h-4" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[11px] text-muted-foreground", children: [
          "Get your key from",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "a",
            {
              href: "https://www.360dialog.com",
              target: "_blank",
              rel: "noopener noreferrer",
              className: "text-primary underline",
              children: "360dialog dashboard"
            }
          ),
          ". Never visible once saved."
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground uppercase tracking-wide", children: "WhatsApp Business Number (E.164)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            type: "tel",
            value: phone,
            onChange: (e) => setPhone(e.target.value),
            placeholder: "+27821234567",
            "data-ocid": "messaging.admin_config.phone"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground uppercase tracking-wide", children: "Webhook Secret" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              type: showSecret ? "text" : "password",
              value: webhookSecret,
              onChange: (e) => setWebhookSecret(e.target.value),
              placeholder: "Optional verification token",
              className: "pr-10",
              "data-ocid": "messaging.admin_config.webhook_secret"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",
              onClick: () => setShowSecret((v) => !v),
              children: showSecret ? /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "w-4 h-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "w-4 h-4" })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground uppercase tracking-wide", children: "Webhook URL (register in 360dialog)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              readOnly: true,
              value: webhookUrl,
              className: "text-xs font-mono bg-muted/30 text-muted-foreground",
              "data-ocid": "messaging.admin_config.webhook_url"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: copyWebhook,
              className: "shrink-0",
              "data-ocid": "messaging.admin_config.copy_webhook",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "w-4 h-4" })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: handleSave,
          disabled: saveConfig.isPending || !apiKey.trim() || !phone.trim(),
          className: "w-full",
          "data-ocid": "messaging.admin_config.save",
          children: [
            saveConfig.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "w-4 h-4 mr-2 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-4 h-4 mr-2" }),
            saveConfig.isPending ? "Saving..." : "Save Configuration"
          ]
        }
      )
    ] })
  ] });
}
function CommandShortcuts({ compact = false }) {
  const handleCopy = (cmd) => {
    navigator.clipboard.writeText(cmd);
    ue.success(`Command "${cmd}" copied — paste it into WhatsApp!`);
  };
  if (compact) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-2", children: COMMANDS.map(({ cmd, desc, emoji }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        className: "flex items-center gap-2 rounded-lg bg-muted/40 border border-border/50 px-3 py-2 text-left hover:bg-muted/70 transition-colors group",
        onClick: () => handleCopy(cmd),
        "data-ocid": `messaging.command.${cmd.replace(/[^a-z0-9]/gi, "_")}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base shrink-0", children: emoji }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[11px] font-bold text-foreground truncate", children: cmd }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground truncate", children: desc })
          ] })
        ]
      },
      cmd
    )) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3", children: "WhatsApp Command Shortcuts" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "command-shortcuts-grid", children: COMMANDS.map(({ cmd, desc, emoji }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        className: "command-shortcut-button",
        onClick: () => handleCopy(cmd),
        "data-ocid": `messaging.command.${cmd.replace(/[^a-z0-9]/gi, "_")}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "command-shortcut-icon", children: emoji }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "command-shortcut-label font-mono text-[11px]", children: cmd }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "command-shortcut-description", children: desc }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "w-3 h-3 text-muted-foreground mt-1 opacity-0 group-hover:opacity-100" })
        ]
      },
      cmd
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground mt-2 text-center", children: "Tap any card to copy command — paste it straight into WhatsApp" })
  ] });
}
function WhatsAppOnboardingGuide({
  whatsappNumber,
  onRegistered
}) {
  const registerPhone = useRegisterWhatsAppPhone();
  const [phoneInput, setPhoneInput] = reactExports.useState("");
  const [registered, setRegistered] = reactExports.useState(false);
  const numberDisplay = whatsappNumber || "Set in admin panel";
  const hasNumber = !!whatsappNumber;
  const waContactUrl = hasNumber ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}` : "#";
  const waOpenUrl = hasNumber ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hi Nduna")}` : "#";
  const handleRegister = () => {
    if (!phoneInput.trim()) return;
    registerPhone.mutate(phoneInput.trim(), {
      onSuccess: () => {
        setRegistered(true);
        setPhoneInput("");
        onRegistered();
      }
    });
  };
  if (registered) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Card,
      {
        className: "border-success/30 bg-success/5 shadow-card",
        "data-ocid": "messaging.onboarding.success_state",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5 text-center space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mx-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-6 h-6 text-success" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display font-bold text-foreground text-lg", children: "You're connected! 🎉" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Open WhatsApp and message us to start chatting with Nduna." })
          ] }),
          hasNumber && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "a",
            {
              href: waOpenUrl,
              target: "_blank",
              rel: "noopener noreferrer",
              "data-ocid": "messaging.onboarding.open_whatsapp_button",
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "gap-2 w-full sm:w-auto", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Smartphone, { className: "w-4 h-4" }),
                "Open WhatsApp"
              ] })
            }
          )
        ] })
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Card,
    {
      className: "border-border/80 shadow-card overflow-hidden",
      "data-ocid": "messaging.onboarding.guide",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "px-5 py-4 flex items-center gap-3",
            style: {
              background: "linear-gradient(135deg, oklch(0.17 0.035 230), oklch(0.22 0.045 240))"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "w-5 h-5 text-white" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display font-bold text-white text-base leading-tight", children: "Chat with Nduna on WhatsApp" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/70 text-xs mt-0.5", children: "3 quick steps to get started" })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5 space-y-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4", "data-ocid": "messaging.onboarding.step_1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-primary", children: "1" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px flex-1 bg-border/50 mt-2" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pb-5 min-w-0 flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-foreground", children: "Save the number" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1 mb-3", children: "Add MoneyDrive to your WhatsApp contacts so you can message us." }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 rounded-lg bg-muted/50 border border-border px-3 py-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "w-3.5 h-3.5 text-primary shrink-0" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-sm font-bold text-foreground", children: numberDisplay })
                ] }),
                hasNumber && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "a",
                  {
                    href: waContactUrl,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    "data-ocid": "messaging.onboarding.save_contact_button",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      Button,
                      {
                        variant: "outline",
                        size: "sm",
                        className: "gap-1.5 text-xs",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Smartphone, { className: "w-3.5 h-3.5" }),
                          "Save Contact"
                        ]
                      }
                    )
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4", "data-ocid": "messaging.onboarding.step_2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-primary", children: "2" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px flex-1 bg-border/50 mt-2" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pb-5 min-w-0 flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-foreground", children: "Register your number" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1 mb-3", children: "Enter your WhatsApp number below so Nduna knows who you are." }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: "flex gap-2",
                  "data-ocid": "messaging.register_phone.form",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        value: phoneInput,
                        onChange: (e) => setPhoneInput(e.target.value),
                        placeholder: "+27821234567",
                        type: "tel",
                        className: "flex-1",
                        onKeyDown: (e) => e.key === "Enter" && handleRegister(),
                        "data-ocid": "messaging.register_phone.input"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        onClick: handleRegister,
                        disabled: registerPhone.isPending || !phoneInput.trim(),
                        "data-ocid": "messaging.register_phone.submit",
                        children: registerPhone.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                          "Link",
                          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "w-3.5 h-3.5 ml-1.5" })
                        ] })
                      }
                    )
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[11px] text-muted-foreground mt-1.5", children: [
                "Include your country code, e.g.",
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-primary", children: "+27821234567" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4", "data-ocid": "messaging.onboarding.step_3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-primary", children: "3" }) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-foreground", children: "Start chatting" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1 mb-3", children: [
                "Open WhatsApp, message us",
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-foreground", children: '"Hi Nduna"' }),
                " ",
                "and you're in. Use these commands to get the most out of Nduna:"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CommandShortcuts, { compact: true })
            ] })
          ] })
        ] })
      ]
    }
  );
}
function ConnectedBadge({ whatsappNumber }) {
  const hasNumber = !!whatsappNumber;
  const waOpenUrl = hasNumber ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hi Nduna")}` : "#";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Card,
    {
      className: "border-success/30 bg-success/5 p-4 flex items-center justify-between gap-3",
      "data-ocid": "messaging.connected.badge",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 rounded-full bg-success/20 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-4 h-4 text-success" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-foreground", children: "WhatsApp connected" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Your number is linked — Nduna recognises your messages" })
          ] })
        ] }),
        hasNumber && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "a",
          {
            href: waOpenUrl,
            target: "_blank",
            rel: "noopener noreferrer",
            "data-ocid": "messaging.connected.open_whatsapp",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                size: "sm",
                className: "gap-1.5 text-xs shrink-0",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Smartphone, { className: "w-3.5 h-3.5" }),
                  "Open"
                ]
              }
            )
          }
        )
      ]
    }
  );
}
function ConversationHistory() {
  const {
    data: history = [],
    isLoading,
    refetch,
    isFetching
  } = useWhatsAppHistory(100);
  const sorted = [...history].sort(
    (a, b) => Number(a.timestamp) - Number(b.timestamp)
  );
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: [1, 2, 3, 4].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: `flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-14 w-64 rounded-2xl" })
      },
      i
    )) });
  }
  if (sorted.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Card,
      {
        className: "p-8 text-center bg-muted/20 border-border/50",
        "data-ocid": "messaging.empty_state",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "w-12 h-12 text-muted-foreground/40 mx-auto mb-3" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-foreground", children: "No messages yet" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto", children: [
            "Follow the steps above to connect your WhatsApp, then send",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-primary font-mono", children: "/help" }),
            " to get started."
          ] })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide", children: "Conversation History" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => refetch(),
          disabled: isFetching,
          className: "h-7 px-2 text-xs gap-1.5",
          "data-ocid": "messaging.refresh",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              RefreshCw,
              {
                className: `w-3 h-3 ${isFetching ? "animate-spin" : ""}`
              }
            ),
            "Refresh"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "message-sync-card bg-card border-border rounded-2xl min-h-[300px] max-h-[55vh] overflow-y-auto px-4 py-4",
        "data-ocid": "messaging.conversation_list",
        children: sorted.map((entry) => /* @__PURE__ */ jsxRuntimeExports.jsx(MessageBubble, { entry }, entry.messageId))
      }
    ),
    sorted.some((e) => e.deliveryStatus === "failed") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "message-error-state mt-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "message-error-icon", children: "!" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "message-error-content", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "message-error-title", children: "Some messages failed to send" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "message-error-text", children: "Check your WhatsApp number registration and ensure your number is linked correctly." })
      ] })
    ] })
  ] });
}
function MessagingPage({ profile, isAdmin = false }) {
  const { data: unreadCount = 0 } = useUnreadWhatsAppCount();
  const { data: isConfigured = false } = useIsWhatsAppConfigured();
  const hasLinkedPhone = !!profile && "whatsappPhone" in profile && typeof profile.whatsappPhone === "string" && profile.whatsappPhone.length > 0;
  const [phoneLinked, setPhoneLinked] = reactExports.useState(hasLinkedPhone);
  const displayNumber = isConfigured ? "+27 [configured in admin]" : "";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto px-4 py-6 space-y-5 animate-fade-up", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-start justify-between gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-2xl font-display font-bold text-foreground flex items-center gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "w-6 h-6 text-primary" }),
        "WhatsApp + Nduna",
        unreadCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Badge,
          {
            className: "bg-primary text-primary-foreground text-xs px-2 ml-1",
            "data-ocid": "messaging.unread_badge",
            children: [
              unreadCount,
              " new"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-0.5", children: "Chat with Nduna directly from WhatsApp — no app needed" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-4 flex items-center justify-between gap-3 border-border/80", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        isConfigured ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-9 h-9 rounded-full bg-success/20 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "w-4 h-4 text-success" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(WifiOff, { className: "w-4 h-4 text-muted-foreground" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold", children: "WhatsApp Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: isConfigured ? "Nduna is live on WhatsApp — drivers can message in" : "Not yet activated — admin needs to configure the API key" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ConnectionStatusBadge, { connected: isConfigured })
    ] }),
    isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx(AdminConfigPanel, {}),
    !isConfigured && !isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "message-error-state", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "message-error-icon", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "w-4 h-4" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "message-error-content", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "message-error-title", children: "WhatsApp not yet activated" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "message-error-text", children: "The admin needs to configure the 360dialog API key. Once live, you'll be able to message Nduna directly from WhatsApp." })
      ] })
    ] }),
    isConfigured && !isAdmin && (phoneLinked ? /* @__PURE__ */ jsxRuntimeExports.jsx(ConnectedBadge, { whatsappNumber: displayNumber }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
      WhatsAppOnboardingGuide,
      {
        whatsappNumber: displayNumber,
        onRegistered: () => setPhoneLinked(true)
      }
    )),
    (phoneLinked || isAdmin) && /* @__PURE__ */ jsxRuntimeExports.jsx(CommandShortcuts, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ConversationHistory, {})
  ] });
}
export {
  MessagingPage as default
};
