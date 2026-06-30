// Utility function to generate image data object for media fields

export interface ImageData {
  CreatedBy: number;
  CreatedDate: string;
  ModifiedBy: number;
  ModifiedDate: string;
  ActionMode: string;
  Custom1: string;
  Custom2: string;
  Custom3: string;
  Custom4: string;
  Custom5: string;
  MediaId: number;
  MediaConfigurationId: number;
  AttributeFamilyId: number;
  Path: string;
  Size: string;
  Height: string;
  Width: string;
  Length: string;
  MediaType: string;
  MediaPathId: number;
  FileName: string;
  ShortDescription: string;
  MediaCategoryId: number;
  Folder: string;
  IsImage: boolean;
  FamilyCode: string;
  MediaServerPath: string;
  MediaServerThumbnailPath: string;
  DisplayName: string;
  OldMediaPath: string;
  IsSVGImage: boolean;
  Version: number;
  AttributeCodeValue: string;
  MediaSource: string;
  IsFromSync: boolean;
  IsImageGenerate: boolean;
}

export const getImageData = (mediaServerPath: string | undefined): ImageData | undefined => {
  if (!mediaServerPath) {
    return undefined;
  }
  const now = new Date().toISOString();
  const pathSegments = mediaServerPath.split(/[/\\]/);
  const fileName = pathSegments[pathSegments.length - 1] || '';
  return {
    CreatedBy: 0,
    CreatedDate: now,
    ModifiedBy: 0,
    ModifiedDate: now,
    ActionMode: '',
    Custom1: '',
    Custom2: '',
    Custom3: '',
    Custom4: '',
    Custom5: '',
    MediaId: 0,
    MediaConfigurationId: 0,
    AttributeFamilyId: 0,
    Path: mediaServerPath,
    Size: '',
    Height: '',
    Width: '',
    Length: '',
    MediaType: '',
    MediaPathId: 0,
    FileName: fileName,
    ShortDescription: '',
    MediaCategoryId: 0,
    Folder: '',
    IsImage: true,
    FamilyCode: '',
    MediaServerPath: mediaServerPath,
    MediaServerThumbnailPath: '',
    DisplayName: fileName,
    OldMediaPath: '',
    IsSVGImage: false,
    Version: 1,
    AttributeCodeValue: '',
    MediaSource: '',
    IsFromSync: false,
    IsImageGenerate: false
  };
};