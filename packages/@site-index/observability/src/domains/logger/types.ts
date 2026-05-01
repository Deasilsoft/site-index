export type LogSink = (message: string) => void;

export type LogWriter = {
  info: LogSink;
  warn: LogSink;
  error: LogSink;
};

export type LoggerOptions = {
  writer?: LogWriter;
  quiet?: boolean;
  verbose?: boolean;
};
