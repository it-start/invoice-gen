
import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { InvoiceData } from '../types';
import { registerFonts, pdfStyles } from '../styles/pdfStyles';

// Register fonts globally
registerFonts();

// Specific overrides or complex unique styles for Invoice
const styles = StyleSheet.create({
  ...pdfStyles, 
  // Bank Table Specifics (Complex Grid)
  bankTable: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#000',
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
        <View style={[styles.row, styles.justifyBetween, styles.mb20]}>
            <View style={{ width: '65%' }}>
                <Text style={styles.bold}>{data.seller.name}</Text>
                <Text style={styles.label}>Получатель</Text>
            </View>
            <View style={{ width: '35%', alignItems: 'flex-end' }}>
                <Text style={[styles.h2, { marginBottom: 2 }]}>{formatCurrency(total)}</Text>
                <Text style={styles.label}>{data.vatRate === -1 ? 'Без НДС' : `В т.ч. НДС ${data.vatRate}%`}</Text>
            </View>
        </View>

        {/* Bank Details Table (Kept specific due to unique layout) */}
        <View style={styles.bankTable}>
            <View style={[styles.row, styles.borderBottom, { height: 45 }]}>
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
             <View style={[styles.row, styles.borderBottom, { height: 45 }]}>
                <View style={[styles.cell, { width: '50%' }]}>
                    <Text style={styles.label}>Кор. Счёт</Text>
                </View>
                 <View style={[styles.cellLast, { width: '50%', justifyContent: 'flex-end' }]}>
                     <Text style={styles.text}>{data.seller.correspondentAccount}</Text>
                </View>
            </View>
             <View style={[styles.row, { height: 45 }]}>
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
             <View style={[styles.row, { borderTopWidth: 1, borderTopColor: '#000' }]}>
                <View style={[styles.cellLast, { width: '100%' }]}>
                    <Text style={styles.label}>Получатель</Text>
                    <Text style={[styles.text, styles.bold]}>{data.seller.name}</Text>
                </View>
            </View>
        </View>

        {/* Invoice Title */}
        <Text style={[styles.h2, styles.mb10]}>Счёт № {data.number} от {formatDate(data.date)}</Text>

        {/* Parties Info */}
        <View style={styles.mb20}>
            <View style={[styles.row, styles.mb4]}>
                <Text style={[styles.text, { width: 80 }]}>Поставщик:</Text>
                <Text style={[styles.text, styles.bold, styles.flex1]}>
                    {data.seller.name}, ИНН {data.seller.inn}, {data.seller.address}
                </Text>
            </View>
             <View style={styles.row}>
                <Text style={[styles.text, { width: 80 }]}>Плательщик:</Text>
                <Text style={[styles.text, styles.bold, styles.flex1]}>
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
                    <Text style={[styles.td, { width: '5%', textAlign: 'center' }]}>{index + 1}</Text>
                    <Text style={[styles.td, { width: '45%' }]}>{item.name}</Text>
                    <Text style={[styles.td, { width: '10%', textAlign: 'center' }]}>{item.quantity}</Text>
                    <Text style={[styles.td, { width: '10%', textAlign: 'center' }]}>шт</Text>
                    <Text style={[styles.td, { width: '15%', textAlign: 'right' }]}>{formatCurrency(item.price)}</Text>
                    <Text style={[styles.td, styles.bold, { width: '15%', textAlign: 'right' }]}>{formatCurrency(item.price * item.quantity)}</Text>
                </View>
            ))}
        </View>

        {/* Totals */}
        <View style={{ marginTop: 20 }}>
            <Text style={styles.mb4}>Всего наименований {data.items.length}, на сумму {formatCurrency(total)}</Text>
            <View style={styles.alignEnd}>
                <View style={[styles.row, styles.mb4, { width: 300, justifyContent: 'flex-end' }]}>
                    <Text style={[styles.bold, { marginRight: 10, fontSize: 12 }]}>Итог к оплате:</Text>
                    <Text style={[styles.bold, { minWidth: 80, textAlign: 'right', fontSize: 12 }]}>{formatCurrency(total)}</Text>
                </View>
                <View style={[styles.row, { width: 300, justifyContent: 'flex-end' }]}>
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
                        <Text style={styles.signatureLabel}>Индивидуальный предприниматель {data.seller.name}</Text>
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
                        <Text style={styles.signatureLabel}>{data.director}</Text>
                    </View>
                    <View style={styles.signatureBlock}>
                        <Text style={styles.bold}>Бухгалтер</Text>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureLabel}>{data.accountant}</Text>
                    </View>
                </>
            )}
        </View>

      </Page>
    </Document>
  );
};
