import { IframeMessenger, type ErrorFunc } from '@higayasuo/iframe-messenger';

type IIIntegrationSuccessResponse = {
  kind: 'success';
  delegation: string;
};

type IIIntegrationResponse = IIIntegrationSuccessResponse;

export class IIIntegrationMessenger extends IframeMessenger<IIIntegrationResponse> {
  constructor(errorFunc: ErrorFunc = console.error) {
    super(errorFunc);
  }
}
