import { defineConfig, presetTypography, presetUno } from 'unocss';

export default defineConfig({
  theme: {
    breakpoints: {
      xs: '320px',
      sm: '640px',
      md: '768px',
      lg: '960px',
      xl: '1100px',
      '2xl': '1536px',
    },
  },
  presets: [presetUno(), presetTypography()],
});
