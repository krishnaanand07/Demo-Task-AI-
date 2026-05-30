export interface PipelineEvent {
  stage: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'REPAIRING';
  log?: string;
  data?: any;
}
