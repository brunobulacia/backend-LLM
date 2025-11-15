export interface ImageAssetDto {
  author: string;
  lifecycleState: 'PUBLISHED';
  specificContent: {
    'com.linkedin.ugc.ShareContent': {
      shareCommentary: {
        text: string;
      };
      shareMediaCategory: 'IMAGE';
      media: [
        {
          status: 'READY';
          description: {
            text: string;
          };
          media: string; //ESTO ES EL ASSET DEVUELTO AL REGISTRAR LA SUBIDA
          title: {
            text: string;
          };
        },
      ];
    };
  };
  visibility: {
    'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC';
  };
}
