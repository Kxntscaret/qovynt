// QOVYNT Configuration
export const CONFIG = {
  APP_NAME: 'QOVYNT',
  SLOGAN: 'Your Life. Your Space.',
  VERSION: '1.0.0',
  DEFAULT_CURRENCY: '฿',
  STORAGE_KEY_PREFIX: 'qovynt_',
  SUPABASE: {
    // Users can override this via UI Settings or this file
    URL: localStorage.getItem('qovynt_supabase_url') || '',
    ANON_KEY: localStorage.getItem('qovynt_supabase_key') || ''
  },
  THEMES: {
    DARK: 'dark',
    LIGHT: 'light'
  }
};
