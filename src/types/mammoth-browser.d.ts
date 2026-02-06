declare module 'mammoth/mammoth.browser' {
  export type ExtractRawTextResult = {
    value: string;
    messages?: Array<{ type: string; message: string }>;
  };

  export function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<ExtractRawTextResult>;
}
