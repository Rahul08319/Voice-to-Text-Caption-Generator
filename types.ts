export enum Status {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  LISTENING = 'LISTENING',
  PROCESSING = 'PROCESSING',
  ERROR = 'ERROR',
}

export interface Caption {
  speakerId: number;
  text: string;
}
