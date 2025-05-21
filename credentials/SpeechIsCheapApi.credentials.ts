import {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class SpeechIsCheapApi implements ICredentialType {
  displayName = 'Speech Is Cheap API';
  documentationUrl = 'https://example.com/todo';
  name = 'speechIsCheapApi';

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Bearer {{$credentials.apiKey}}',
        accept: 'application/json',
      },
    },
  };

  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
    },
  ];


  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://api.speechischeap.com/v2/jobs',
      url: '/auth',
    },
  };
}
