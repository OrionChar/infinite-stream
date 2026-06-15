/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly LLM_STUDIO_API_TOKEN: string,
    readonly LLM_STUDIO_HOST: string,
    readonly LLM_STUDIO_PORT: string,

    readonly TEMPORAL_STORAGE: string,
    readonly VITE_ARTICLE_STORAGE: string,
    readonly VITE_SCRIPT_STORAGE: string,
    readonly VITE_AUDIO_STORAGE: string,
    readonly VITE_VIDEO_STORAGE: string,

    readonly STREAMING_RTMP_SERVER: string,
    readonly STREAMING_RTMP_KEY: string,

    readonly COMFYUI_HOST_PORT: string,
    readonly COMFYUI_HOST: string,

    readonly SH_FOLDER: string,
    readonly BIN_FOLDER: string,
    readonly MEDIA_FOLDER: string,
    readonly PYTHON_FOLDER: string,
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

