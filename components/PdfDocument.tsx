import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { InvoiceData } from '../types';

// Register fonts
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Roboto',
    fontSize: 10,
    lineHeight: 1.4,
  },
  topHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 15,
      alignItems: 'flex-start'
  },
  topHeaderLeft: {
      width: '65%',
  },
  topHeaderRight: {
      width: '35%',
      alignItems: 'flex-end',
  },
  largeAmount: {
      fontSize: 14,
      fontWeight: 'bold',
  },
  bankTable: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#000',
  },
  bankRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  bankRowLast: {
      flexDirection: 'row',
      borderBottomWidth: 0,
  },
  cell: {
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  cellLast: {
    padding: 4,
    borderRightWidth: 0,
  },
  label: {
    fontSize: 8,
    color: '#555',
    marginBottom: 2,
  },
  text: {
    fontSize: 10,
  },
  bold: {
    fontWeight: 'bold',
  },
  invoiceTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 10,
  },
  partyRow: {
      flexDirection: 'row',
      marginBottom: 4,
  },
  partyLabel: {
      width: 80,
      fontSize: 10,
  },
  partyValue: {
      flex: 1,
      fontSize: 10,
      fontWeight: 'bold',
  },
  table: {
    width: '100%',
    marginTop: 15,
    marginBottom: 15,
    borderTopWidth: 2,
    borderTopColor: '#000',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 4,
    paddingTop: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingTop: 4,
    paddingBottom: 4,
  },
  th: {
      fontWeight: 'bold',
      fontSize: 9,
  },
  totalsSection: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
    width: 300,
  },
  totalLabel: {
    textAlign: 'right',
    marginRight: 10,
    fontWeight: 'bold',
  },
  totalValue: {
    textAlign: 'right',
    fontWeight: 'bold',
    minWidth: 80,
  },
  signatureSection: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBlock: {
    width: '45%',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginTop: 15,
    marginBottom: 2,
  },
  signatureSub: {
      fontSize: 8,
      color: '#555',
      textAlign: 'center',
  }
});

interface PdfDocumentProps {
  data: InvoiceData;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' руб.';
};

const formatDate = (dateString: string) => {
    if(!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);
};

export const InvoicePdf: React.FC<PdfDocumentProps> = ({ data }) => {
  const subtotal = data.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  const vatAmount = data.vatRate > 0 ? subtotal * (data.vatRate / 100) : 0;
  const total = subtotal + vatAmount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Top Header Section */}
        <View style={styles.topHeader}>
            <View style={styles.topHeaderLeft}>
                <Text style={styles.bold}>{data.seller.name}</Text>
                <Text style={styles.label}>Получатель</Text>
            </View>
            <View style={styles.topHeaderRight}>
                <Text style={styles.largeAmount}>{formatCurrency(total)}</Text>
                <Text style={styles.label}>{data.vatRate === -1 ? 'Без НДС' : `В т.ч. НДС ${data.vatRate}%`}</Text>
            </View>
        </View>

        {/* Bank Details Table */}
        <View style={styles.bankTable}>
            <View style={[styles.bankRow, { height: 45 }]}>
                <View style={[styles.cell, { width: '50%' }]}>
                    <Text style={styles.label}>Банк получателя</Text>
                    <Text style={styles.text}>{data.seller.bankName}</Text>
                </View>
                <View style={[styles.cell, { width: '10%' }]}>
                     <Text style={styles.label}>БИК</Text>
                </View>
                 <View style={[styles.cellLast, { width: '40%', justifyContent: 'flex-end' }]}>
                     <Text style={styles.text}>{data.seller.bik}</Text>
                </View>
            </View>
             <View style={[styles.bankRow, { height: 45 }]}>
                <View style={[styles.cell, { width: '50%' }]}>
                    <Text style={styles.label}>Кор. Счёт</Text>
                </View>
                 <View style={[styles.cellLast, { width: '50%', justifyContent: 'flex-end' }]}>
                     <Text style={styles.text}>{data.seller.correspondentAccount}</Text>
                </View>
            </View>
             <View style={[styles.bankRowLast, { height: 45 }]}>
                <View style={[styles.cell, { width: '20%' }]}>
                     <Text style={styles.label}>ИНН</Text>
                     <Text style={styles.text}>{data.seller.inn}</Text>
                </View>
                <View style={[styles.cell, { width: '30%' }]}>
                    <Text style={styles.label}>КПП</Text>
                    <Text style={styles.text}>{data.seller.kpp || '—'}</Text>
                </View>
                <View style={[styles.cell, { width: '10%' }]}>
                     <Text style={styles.label}>Счёт</Text>
                </View>
                 <View style={[styles.cellLast, { width: '40%', justifyContent: 'flex-end' }]}>
                    <Text style={styles.text}>{data.seller.accountNumber}</Text>
                </View>
            </View>
            {/* Split row manually because of complex colspan layout in PDF */}
             <View style={[styles.bankRow, { borderTopWidth: 1, borderTopColor: '#000' }]}>
                <View style={[styles.cellLast, { width: '100%' }]}>
                    <Text style={styles.label}>Получатель</Text>
                    <Text style={[styles.text, styles.bold]}>{data.seller.name}</Text>
                </View>
            </View>
        </View>

        {/* Invoice Title */}
        <Text style={styles.invoiceTitle}>Счёт № {data.number} от {formatDate(data.date)}</Text>

        {/* Parties Info */}
        <View style={{ marginBottom: 15 }}>
            <View style={styles.partyRow}>
                <Text style={styles.partyLabel}>Поставщик:</Text>
                <Text style={styles.partyValue}>
                    {data.seller.name}, ИНН {data.seller.inn}, {data.seller.address}
                </Text>
            </View>
             <View style={styles.partyRow}>
                <Text style={styles.partyLabel}>Плательщик:</Text>
                <Text style={styles.partyValue}>
                    {data.buyer.name}, ИНН {data.buyer.inn}, {data.buyer.address}
                </Text>
            </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
            <View style={styles.tableHeader}>
                 <Text style={[styles.th, { width: '5%', textAlign: 'center' }]}>№</Text>
                 <Text style={[styles.th, { width: '45%' }]}>Название товара (услуги)</Text>
                 <Text style={[styles.th, { width: '10%', textAlign: 'center' }]}>Кол-во</Text>
                 <Text style={[styles.th, { width: '10%', textAlign: 'center' }]}>Ед.</Text>
                 <Text style={[styles.th, { width: '15%', textAlign: 'right' }]}>Цена</Text>
                 <Text style={[styles.th, { width: '15%', textAlign: 'right' }]}>Сумма</Text>
            </View>

            {data.items.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                    <Text style={[styles.text, { width: '5%', textAlign: 'center' }]}>{index + 1}</Text>
                    <Text style={[styles.text, { width: '45%' }]}>{item.name}</Text>
                    <Text style={[styles.text, { width: '10%', textAlign: 'center' }]}>{item.quantity}</Text>
                    <Text style={[styles.text, { width: '10%', textAlign: 'center' }]}>шт</Text>
                    <Text style={[styles.text, { width: '15%', textAlign: 'right' }]}>{formatCurrency(item.price)}</Text>
                    <Text style={[styles.text, styles.bold, { width: '15%', textAlign: 'right' }]}>{formatCurrency(item.price * item.quantity)}</Text>
                </View>
            ))}
        </View>

        {/* Totals */}
        <View style={{ marginBottom: 20 }}>
            <Text style={{ marginBottom: 5 }}>Всего наименований {data.items.length}, на сумму {formatCurrency(total)}</Text>
            <View style={styles.totalsSection}>
                <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { fontSize: 12 }]}>Итог к оплате:</Text>
                    <Text style={[styles.totalValue, { fontSize: 12 }]}>{formatCurrency(total)}</Text>
                </View>
                <View style={styles.totalRow}>
                     <Text style={styles.label}>{data.vatRate === -1 ? 'Без НДС' : `В т.ч. НДС ${formatCurrency(vatAmount)}`}</Text>
                </View>
            </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
            {data.sellerType === 'person' ? (
                <>
                    <View style={styles.signatureBlock}>
                        <Text style={styles.bold}>Получатель:</Text>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureSub}>Индивидуальный предприниматель {data.seller.name}</Text>
                    </View>
                    <View style={styles.signatureBlock}>
                        <Text style={styles.bold}>Плательщик:</Text>
                         <View style={styles.signatureLine} />
                    </View>
                </>
            ) : (
                <>
                    <View style={styles.signatureBlock}>
                        <Text style={styles.bold}>Руководитель</Text>
                        <View style={styles.signatureLine} />
                        <Text style={{ fontSize: 9, textAlign: 'center' }}>{data.director}</Text>
                    </View>
                    <View style={styles.signatureBlock}>
                        <Text style={styles.bold}>Бухгалтер</Text>
                        <View style={styles.signatureLine} />
                        <Text style={{ fontSize: 9, textAlign: 'center' }}>{data.accountant}</Text>
                    </View>
                </>
            )}
        </View>

      </Page>
    </Document>
  );
};