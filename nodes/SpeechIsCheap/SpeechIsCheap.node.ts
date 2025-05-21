import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IHttpRequestOptions,
} from 'n8n-workflow';

import { NodeOperationError } from 'n8n-workflow';

export class SpeechIsCheap implements INodeType {
  description: INodeTypeDescription = {
    defaults: { name: 'Speech is Cheap' },
    description: 'Low cost 𝐰𝐨𝐫𝐥𝐝 𝐜𝐥𝐚𝐬𝐬 transcriptions',
    displayName: 'Speech is Cheap',
    group: ['transform'],
    icon: 'file:speechischeap.svg',
    inputs: ['main'],
    name: 'speechIsCheap',
    outputs: ['main'],
    subtitle: '={{ $parameter["operation"] }}',
    version: 2,

    credentials: [{
      name: 'speechIsCheapApi',
      required: true,
    }],

    properties: [
      {
        displayName: 'Operation',

        default: 'transcribe',
        name: 'operation',
        noDataExpression: true,
        options: [ { name: 'Transcribe', value: 'transcribe' } ],
        type: 'hidden',
      },

      {
        displayName: 'Input URL',

        default: '',
        description: 'The URL of the audio file to transcribe',
        displayOptions: { show: { operation: ['transcribe'] } },
        name: 'input_url',
        placeholder: 'https://example.com/audio.mp3',
        required: true,
        type: 'string',
      },
      {
        displayName: 'Webhook URL',

        default: '',
        description: 'The URL that will receive the transcription results when complete',
        displayOptions: { show: { operation: ['transcribe'] } },
        name: 'webhook_url',
        placeholder: 'https://your-webhook-url.com/callback', // REVISIT
        required: true,
        type: 'string',
      },
      {
        displayName: 'Can Parse Speakers?',

        default: false,
        description: 'Whether to add a `speaker_id` to each segment based on the speaker\'s voice. See https://speechischeap.com/#addons for pricing.',
        displayOptions: { show: { operation: ['transcribe'] } },
        name: 'can_parse_speakers',
        type: 'boolean',
      },
      {
        displayName: 'Can Parse Words?',

        default: false,
        description: 'Whether to include a timecode for every word in the transcription. See https://speechischeap.com/#addons for pricing.',
        displayOptions: { show: { operation: ['transcribe'] } },
        name: 'can_parse_words',
        type: 'boolean',
      },
      {
        displayName: 'Can Label Audio?',

        default: false,
        description: 'Whether to include an audio classification label in the transcription. See https://speechischeap.com/#addons for pricing.',
        displayOptions: { show: { operation: ['transcribe'] } },
        name: 'can_label_audio',
        type: 'boolean',
      },
      {
        displayName: 'Minimum Confidence Threshold (0.00 - 1.00)',

        default: 0.50,
        description: 'Filter out segments that fall below this confidence threshold',
        displayOptions: { show: { operation: ['transcribe'] } },
        name: 'minimum_confidence',
        type: 'number',

        typeOptions: {
          maxValue: 1.00,
          minValue: 0.00,
          numberPrecision: 2,
        },
      },
      {
        displayName: 'Segment Duration (6-30)',

        default: 30,
        description: 'Duration of each audio segment in seconds',
        displayOptions: { show: { operation: ['transcribe'] } },
        name: 'segment_duration',
        type: 'number',

        typeOptions: {
          maxValue: 30,
          minValue: 6,
        },
      },
      {
        displayName: 'Language',

        default: '',
        description: 'Language code (e.g., en, es, fr). Leave empty for auto-detection.',
        displayOptions: { show: { operation: ['transcribe'] } },
        name: 'language',
        type: 'string',
      },
      {
        displayName: 'Prompt',

        default: '',
        description: 'Optional text to guide the transcription model',
        displayOptions: { show: { operation: ['transcribe'] } },
        name: 'prompt',
        type: 'string',
      },
      {
        displayName: 'Hotwords',

        default: '',
        description: 'Comma-separated list of important words or phrases to recognize',
        displayOptions: { show: { operation: ['transcribe'] } },
        name: 'hotwords',
        type: 'string',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const operation = this.getNodeParameter('operation', 0) as string;
    const returnData: INodeExecutionData[] = [];

    if (operation === 'transcribe') {
      for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
        const canLabelAudio = this.getNodeParameter('can_label_audio', itemIndex, false) as boolean;
        const canParseSpeakers = this.getNodeParameter('can_parse_speakers', itemIndex, false) as boolean;
        const canParseWords = this.getNodeParameter('can_parse_words', itemIndex, false) as boolean;
        const hotwords = this.getNodeParameter('hotwords', itemIndex, '') as string;
        const inputUrl = this.getNodeParameter('input_url', itemIndex, '') as string;
        const language = this.getNodeParameter('language', itemIndex, '') as string;
        const minimumConfidence = this.getNodeParameter('minimum_confidence', itemIndex, 0.5) as number;
        const prompt = this.getNodeParameter('prompt', itemIndex, '') as string;
        const segmentDuration = this.getNodeParameter('segment_duration', itemIndex, 30) as number;
        const webhookUrl = this.getNodeParameter('webhook_url', itemIndex, '') as string;

        if (segmentDuration < 6 || segmentDuration > 30) {
          throw new NodeOperationError(this.getNode(), 'Segment duration must be between 6 and 30 seconds (inclusive)');
        }

        if (minimumConfidence < 0 || minimumConfidence > 1) {
          throw new NodeOperationError(this.getNode(), 'Minimum confidence must be between 0.00 and 1.00 (inclusive)');
        }

        const payload: Record<string, any> = {
          can_label_audio: canLabelAudio,
          can_parse_speakers: canParseSpeakers,
          can_parse_words: canParseWords,
          hotwords: hotwords,
          input_url: inputUrl,
          language: language,
          minimum_confidence: minimumConfidence,
          prompt: prompt,
          segment_duration: segmentDuration,
          webhook_url: webhookUrl,
        };

        const options: IHttpRequestOptions = {
          body: payload,
          json: true,
          method: 'POST',
          url: 'https://api.speechischeap.com/v2/jobs/',
        };

        const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'speechIsCheapApi', options);

        returnData.push(responseData);
      }
    }

    return [this.helpers.returnJsonArray(returnData)];
  }
}
