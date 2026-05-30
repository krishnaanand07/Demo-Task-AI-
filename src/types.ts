export interface ExtractedIntent {
  appType: string;
  coreFeatures: string[];
  userRoles: string[];
  entities: string[];
  workflows: string[];
  assumptions: string[];
  ambiguities: string[];
  requiredPages: string[];
  authRequirements: {
    authentication: boolean;
    roleBasedAccess: boolean;
  };
}

export interface SystemDesign {
  architecture: string;
  dataModels: {
    name: string;
    description: string;
    fields: string[];
  }[];
  userFlows: string[];
}

export interface ValidationOutput {
  isConsistent: boolean;
  errors: Array<{
    issue: string;
    affectedModule: string;
    recommendation: string;
  }>;
  warnings: string[];
  checkedRelations: {
    uiToApi: boolean;
    apiToDb: boolean;
    authToRoutes: boolean;
  };
}

export interface RepairOutput {
  repairedModule: any;
  repairSummary: {
    fixedIssues: string[];
    preservedModules: string[];
    consistencyStatus: boolean;
  };
}

export interface PipelineEvent {
  stage: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'REPAIRING';
  log?: string;
  data?: any;
}

export type OnProgress = (event: PipelineEvent) => void;
