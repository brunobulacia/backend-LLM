export function CrearCredencialesDto(title: string) {
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
      video_size: 574823,
      chunk_size: 574823,
      total_chunk_count: 1,
    },
  };
}
