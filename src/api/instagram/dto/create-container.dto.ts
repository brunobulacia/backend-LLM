export interface CreateContainerDto {
  image_url: string;
  caption: string;
  media_type?: 'PHOTO' | 'VIDEO'; // Opcional - Instagram lo infiere automáticamente desde image_url
}
