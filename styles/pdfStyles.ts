
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

// Common color palette
const colors = {
    text: '#111',
    label: '#555',
    border: '#000',
    borderLight: '#ccc',
    bgLight: '#f9f9f9',
};

export const pdfStyles = StyleSheet.create({
  // --- BASE ---
  page: {
    padding: 30,
    fontFamily: 'Roboto',
    fontSize: 10,
    color: colors.text,
    lineHeight: 1.4,
  },
  
  // --- TYPOGRAPHY ---
  bold: {
    fontWeight: 'bold',
  },
  text: {
    fontSize: 10,
  },
  small: {
    fontSize: 8,
  },
  label: {
    fontSize: 8,
    color: colors.label,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  title: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 10,
  },
  h2: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 6,
  },
  h3: {
      fontSize: 12,
      fontWeight: 'bold',
      marginBottom: 4,
  },

  // --- LAYOUT UTILS ---
  row: {
      flexDirection: 'row',
  },
  col: {
      flexDirection: 'column',
  },
  flex1: {
      flex: 1,
  },
  justifyBetween: {
      justifyContent: 'space-between',
  },
  alignCenter: {
      alignItems: 'center',
  },
  alignEnd: {
      alignItems: 'flex-end',
  },
  alignBase: {
      alignItems: 'baseline',
  },
  
  // --- SPACING ---
  mb2: { marginBottom: 2 },
  mb4: { marginBottom: 4 },
  mb8: { marginBottom: 8 },
  mb10: { marginBottom: 10 },
  mb20: { marginBottom: 20 },
  p4: { padding: 4 },
  p10: { padding: 10 },
  
  // --- COMPONENTS ---
  
  // Box/Borders
  borderBottom: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
  },
  borderBottomLight: {
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
  },
  box: {
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: 4,
  },

  // Tables
  table: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingVertical: 4,
  },
  th: {
      fontSize: 9,
      fontWeight: 'bold',
  },
  td: {
      fontSize: 10,
  },
  
  // Signatures
  signatureSection: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 40,
  },
  signatureBlock: {
    flex: 1,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: 25,
    marginBottom: 4,
  },
  signatureLabel: {
      fontSize: 8,
      color: colors.label,
      textAlign: 'center',
  }
});
