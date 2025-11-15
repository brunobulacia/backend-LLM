// PARA OBTENER EL UPLOAD URL Y ASSET DE LA IMAGEN A SUBIR
export interface RegistrarSubidaDto {
  registerUploadRequest: {
    recipes: ['urn:li:digitalmediaRecipe:feedshare-image'];
    owner: string;
    serviceRelationships: [
      {
        relationshipType: 'OWNER';
        identifier: 'urn:li:userGeneratedContent';
      },
    ];
  };
}

//RESPONSE DE REGISTRAR LA SUBIDA
export interface RegistrarSubidaResponseDto {
  value: {
    mediaArtifact: string;
    uploadMechanism: {
      'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
        uploadUrl: string;
        headers: {
          'media-type-family': string;
        };
      };
    };
    asset: string;
    assetRealTimeTopic: string;
  };
}
