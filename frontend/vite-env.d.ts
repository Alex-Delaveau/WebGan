/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string; // Ajoutez toutes vos variables ici
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
