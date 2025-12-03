
import { Font, StyleSheet } from '@react-pdf/renderer';

// Register fonts once to be used across all PDF documents
export const registerFonts = () => {
  Font.register({
    family: 'Roboto',
    fonts: [
      { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
      { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
    ],
  });
};

export const pdfStyles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Roboto',
    fontSize: 10,
    color: '#111',
    lineHeight: 1.4,
  },
  bold: {
    fontWeight: 'bold',
  },
  text: {
    fontSize: 10,
  },
  label: {
    fontSize: 8,
    color: '#555',
    marginBottom: 2,
  },
});
