declare global {
  namespace NodeJS {
    interface ProcessEnv {
      LLM_STUDIO_HOST: string,
      LLM_STUDIO_PORT: string,

      ARTICLE_STORAGE: string,
      SCRIPT_STORAGE: string,
      AUDIO_STORAGE: string,
      VIDEO_STORAGE: string,

      STREAMING_RTMP_SERVER: string,
      STREAMING_RTMP_KEY: string,

      COMFYUI_HOST_PORT: string,
      COMFYUI_HOST: string,

      SH_FOLDER: string,
      BIN_FOLDER: string,
      MEDIA_FOLDER: string,
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export { }
