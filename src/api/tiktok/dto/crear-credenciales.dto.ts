export function CrearCredencialesDto(title: string, videoSize?: number) {
  const size = videoSize || 574823; // Usar el tamaño proporcionado o un valor por defecto

  return {
    post_info: {
      title: title,
      privacy_level: 'SELF_ONLY',
      disable_duet: false,
      disable_comment: true,
      disable_stitch: false,
      video_cover_timestamp_ms: 1000,
    },
    source_info: {
      source: 'FILE_UPLOAD',
      video_size: size,
      chunk_size: size,
      total_chunk_count: 1,
    },
  };
}
