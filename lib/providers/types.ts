export interface ProviderClient {
  label: string;
  defaultModel: string;
  complete(
    systemPrompt: string,
    userText: string,
    temperature: number,
    model: string,
    apiKey: string
  ): Promise<string>;
}
