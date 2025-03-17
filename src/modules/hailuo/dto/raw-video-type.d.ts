export type RawVideoType = {
  id: string;
  desc: string;
  coverURL: string;
  videoURL: string;
  status: number;
  message: string;
  canRetry: boolean;
  width: number;
  height: number;
  originFiles: {
    id: string;
    url: string;
    type: string;
  }[];
  canAppeal: boolean;
  hasVoice: boolean;
  canCancel: boolean;
  modelID: string;
  useOriginPrompt: boolean;
  isBookmarked: boolean;
  disableGenerateSimilar: boolean;
  createTime: number;
  postStatus: number;
  userID: number;
  createType: number;
  promptImgURL: string;
  extra: {
    cameraMotions: any;
    promptStruct: string;
  };
  videoURLs: {
    feedURL: string;
  };
  priority: number;
  generatorType: number;
  isInFolder: boolean;
  batchID: string;
  aspectRatio: string;
  fileID: string;
  tags: string[];
  duration: number;
  resolution: number;
  humanCheckStatus: number;
};
