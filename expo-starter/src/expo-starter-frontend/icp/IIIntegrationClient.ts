import { WebClient, type ErrorFunc } from '@/web-client/WebClient';

type IIIntegrationSuccessResponse = {
  kind: 'success';
  delegation: string;
};

type IIIntegrationResponse = IIIntegrationSuccessResponse;

export class IIIntegrationClient extends WebClient<IIIntegrationResponse> {
  constructor(errorFunc: ErrorFunc = console.error) {
    super(errorFunc);
  }
}
