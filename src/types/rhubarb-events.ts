// ============================================================
// Mouth Shapes — Preston Blair Phoneme Set
// ============================================================

/** Preston Blair mouth shapes used for lip-sync animation */
export enum MouthShape {
  /** Closed mouth — M, B, P */
  A = "A",
  /** Clenched teeth — S, Z */
  B = "B",
  /** Mouth slightly open — T, D, N, L */
  C = "C",
  /** Mouth wide open — C, K, G */
  D = "D",
  /** Mouth slightly rounded — E */
  E = "E",
  /** Mouth rounded — O, R */
  F = "F",
  /** Mouth small rounded — W, Q */
  G = "G",
  /** Mouth pursed — F, V */
  H = "H",
  /** Rest / idle position — silence */
  X = "X",
}

// ============================================================
// Phones / Phonemes (ARPAbet)
// ============================================================

/** ARPAbet vowel phonemes */
export type VowelPhone =
  | "AA"
  | "AE"
  | "AH"
  | "AO"
  | "EH"
  | "ER"
  | "EY"
  | "IH"
  | "IY"
  | "OW"
  | "OY"
  | "UH"
  | "UW";

/** ARPAbet consonant phonemes */
export type ConsonantPhone =
  | "B"
  | "CH"
  | "D"
  | "DH"
  | "F"
  | "G"
  | "HH"
  | "JH"
  | "K"
  | "L"
  | "M"
  | "N"
  | "NG"
  | "P"
  | "R"
  | "S"
  | "SH"
  | "T"
  | "TH"
  | "V"
  | "W"
  | "Y"
  | "Z"
  | "ZH";

/** Special phone markers */
export type SpecialPhone = "STOP" | "SILENCE";

/** All recognised phone/phoneme types */
export type Phone = VowelPhone | ConsonantPhone | SpecialPhone;

// ============================================================
// Core Data Types
// ============================================================

/** A time range expressed in seconds */
export interface TimeRange {
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
}

/** A single mouth cue with timing */
export interface MouthCue {
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  /** Mouth shape for this time span */
  value: MouthShape;
}

/** A recognised phone with timing */
export interface TimedPhone {
  /** The recognised phone/phoneme */
  phone: Phone;
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
}

/** A recognised word with timing (from speech recognition) */
export interface TimedWord {
  /** The recognised word */
  word: string;
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
}

// ============================================================
// Lip-Sync Result (JSON Output)
// ============================================================

/** Metadata about the lip-sync input */
export interface LipSyncMetadata {
  /** Path to the source audio file */
  soundFile: string;
  /** Duration of the audio in seconds */
  duration: number;
}

/** The complete lip-sync result produced by Rhubarb */
export interface LipSyncResult {
  metadata: LipSyncMetadata;
  mouthCues: MouthCue[];
}

// ============================================================
// Progress Events (—machineReadable mode)
// ============================================================

/** Processing stages in the lip-sync pipeline */
export enum ProcessingStage {
  /** Loading and decoding the audio file */
  AudioLoading = "audioLoading",
  /** Recognising speech in the audio */
  SpeechRecognition = "speechRecognition",
  /** Mapping speech to phonemes */
  PhoneRecognition = "phoneRecognition",
  /** Generating mouth-shape animation from phones */
  Animation = "animation",
  /** Exporting the result to the requested format */
  Export = "export",
}

/** Progress event emitted during processing */
export interface ProgressEvent {
  /** Discriminator for the event union */
  type: "progress";
  /** Progress fraction from 0.0 to 1.0 */
  value: number;
  log: LogEvent;
}

// ============================================================
// Log Events
// ============================================================

/** Log severity levels (mirrors src/logging/Level.h) */
export enum LogLevel {
  Trace = "trace",
  Debug = "debug",
  Info = "info",
  Warning = "warning",
  Error = "error",
  Fatal = "fatal",
}

/** Log event emitted during processing */
export interface LogEvent {
  /** Discriminator for the event union */
  type: "log";
  /** Severity level */
  level: LogLevel;
  /** Log message */
  message: string;
  /** Epoch milliseconds */
  timestamp?: number;
}

// ============================================================
// Start / Completion Events
// ============================================================

/** Emitted when processing begins */
export interface StartEvent {
  type: "start";
  /** Path of the input audio file */
  soundFile: string;
  /** Duration of the audio in seconds (populated after audio load) */
  duration?: number;
}

/** Emitted when processing finishes successfully */
export interface SuccessEvent {
  type: "success";
  /** The resulting mouth cues */
}

/** Emitted when processing fails */
export interface FailureEvent {
  type: "failure";
  /** Error message */
  reason: string;
}

// ============================================================
// Union of All Events
// ============================================================

/** All events that can be emitted by Rhubarb during processing */
export type RhubarbEvent =
  | StartEvent
  | ProgressEvent
  | LogEvent
  | SuccessEvent
  | FailureEvent;

// ============================================================
// Output Formats
// ============================================================

/** Supported output file formats */
export enum OutputFormat {
  /** JSON (default) */
  Json = "json",
  /** Tab-separated values */
  Tsv = "tsv",
  /** XML */
  Xml = "xml",
  /** Adobe After Effects .dat */
  Dat = "dat",
}

// ============================================================
// Speech Recogniser Back-ends
// ============================================================

/** Available speech-recogniser back-ends */
export enum Recognizer {
  /** PocketSphinx offline recogniser */
  PocketSphinx = "pocketsphinx",
  /** Built-in phoneme-level recogniser */
  Phonetic = "phonetic",
}

// ============================================================
// Mouth-shape Set
// ============================================================

/** Extended mouth shape option */
export enum MouthShapeSet {
  /** Standard 9-shape Preston Blair set (A–H + X) */
  Basic = "basic",
  /** Extended set with additional shape variants */
  Extended = "extended",
}

// ============================================================
// Configuration / CLI Options
// ============================================================

/** Full set of options accepted by Rhubarb */
export interface RhubarbOptions {
  /** Path to the input audio file */
  soundFile: string;

  /** Optional plain-text dialog/transcript file for guided recognition */
  dialogFile?: string;

  /** Output format */
  outputFormat?: OutputFormat;

  /** Speech recogniser to use */
  recognizer?: Recognizer;

  /** Mouth shape set */
  mouthShapeSet?: MouthShapeSet;

  /** Output file path (defaults to stdout) */
  outputFile?: string;

  /** Minimum log level to emit */
  logLevel?: LogLevel;

  /** Emit machine-readable progress on stderr */
  machineReadable?: boolean;

  /** Override the console width for progress bar rendering */
  consoleWidth?: number;

  /** Supply explicit dialog text inline instead of a file */
  dialog?: string;
}

// ============================================================
// Animation Internals (for advanced/library usage)
// ============================================================

/** A rule mapping a phone to a mouth shape with possible tweening */
export interface ShapeRule {
  /** The phone this rule applies to */
  phone: Phone;
  /** The mouth shape to display */
  shape: MouthShape;
  /** Duration in seconds */
  duration: number;
  /** Start time in seconds */
  start: number;
}

/** Timeline of mouth shapes (internal animation representation) */
export interface AnimationTimeline {
  /** Ordered list of shape rules */
  rules: ShapeRule[];
  /** Total duration in seconds */
  duration: number;
}

/** Result of the speech-recognition step */
export interface SpeechRecognitionResult {
  /** Recognised words with timing */
  words: TimedWord[];
  /** Full transcript text */
  text: string;
}

/** Result of the phone-recognition step */
export interface PhoneRecognitionResult {
  /** Recognised phones with timing */
  phones: TimedPhone[];
}

// ============================================================
// Event Handler Callback Types
// ============================================================

/** Callback for progress updates */
export type ProgressCallback = (event: ProgressEvent) => void;

/** Callback for log messages */
export type LogCallback = (event: LogEvent) => void;

/** Generic event handler */
export type RhubarbEventCallback = (event: RhubarbEvent) => void;

/** Configuration for an event-driven Rhubarb invocation */
export interface RhubarbEventConfig {
  /** Options for the Rhubarb run */
  options: RhubarbOptions;
  /** Progress callback */
  onProgress?: ProgressCallback;
  /** Log callback */
  onLog?: LogCallback;
  /** Generic event callback */
  onEvent?: RhubarbEventCallback;
}

// ============================================================
// Type Guards
// ============================================================

export const isProgressEvent = (e: RhubarbEvent): e is ProgressEvent =>
  e.type === "progress";

export const isLogEvent = (e: RhubarbEvent): e is LogEvent =>
  e.type === "log";

export const isStartEvent = (e: RhubarbEvent): e is StartEvent =>
  e.type === "start";

export const isSuccessEvent = (e: RhubarbEvent): e is SuccessEvent =>
  e.type === "success";

export const isFailureEvent = (e: RhubarbEvent): e is FailureEvent =>
  e.type === "failure";