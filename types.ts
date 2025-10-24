export interface Hashtag {
  tag: string;
  category: string;
}

export interface CaptionResult {
  titleCaption: string;
  mediumCaption: string;
  largeCaption: string;
  hashtags: Hashtag[];
}

export interface HistoryItem {
  id: string;
  imageUrl: string;
  result: CaptionResult;
}