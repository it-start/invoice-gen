
import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { InvoiceData, InvoiceItem, Party } from '../types';
import { registerFonts, pdfStyles } from '../styles/pdfStyles';

// Register fonts globally
registerFonts();

// Define column widths for consistency
const TABLE_COLS = {
  no: '5%',
  name: '48%',
  qty: '10%',
  unit: '7%',
  price: '15%',
  total: '15%',
};

// Specific overrides or complex unique styles for Invoice
const styles = StyleSheet.create({
  ...pdfStyles, 
  // Bank Table Specifics
  bankTable: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#000',
    fontSize: 9,
  },
  bankRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    minHeight: 40,
  },
  bankRowSmall: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    minHeight: 25,
  },
  cell: {
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#000',
    justifyContent: 'center',
  },
  cellLast: {
    padding: 4,
    borderRightWidth: 0,
    justifyContent: 'center',
  },
  // Item Table Specifics
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    alignItems: 'center',
    minHeight: 24,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    height: 24,
  },
  thCenter: {
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 4,
  },
  thLeft: {
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'left',
    padding: 4,
  },
  thRight: {
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'right',
    padding: 4,
  },
  tdCenter: {
    fontSize: 9,
    textAlign: 'center',
    padding: 4,
  },
  tdLeft: {
    fontSize: 9,
    textAlign: 'left',
    padding: 4,
  },
  tdRight: {
    fontSize: 9,
    textAlign: 'right',
    padding: 4,
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

// --- Subcomponents ---

const InvoiceHeader: React.FC<{ data: InvoiceData, total: number }> = ({ data, total }) => (
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
);

const BankDetailsSection: React.FC<{ seller: Party }> = ({ seller }) => (
  <View style={styles.bankTable}>
      {/* Row 1 */}
      <View style={styles.bankRow}>
          <View style={[styles.cell, { width: '50%' }]}>
              <Text style={styles.label}>Банк получателя</Text>
              <Text style={styles.text}>{seller.bankName}</Text>
          </View>
          <View style={[styles.cell, { width: '10%' }]}>
                <Text style={styles.label}>БИК</Text>
          </View>
            <View style={[styles.cellLast, { width: '40%', alignItems: 'flex-end' }]}>
                <Text style={styles.text}>{seller.bik}</Text>
          </View>
      </View>
      {/* Row 2 */}
        <View style={styles.bankRow}>
          <View style={[styles.cell, { width: '50%' }]}>
              <Text style={styles.label}>Кор. Счёт</Text>
          </View>
            <View style={[styles.cellLast, { width: '50%', alignItems: 'flex-end' }]}>
                <Text style={styles.text}>{seller.correspondentAccount}</Text>
          </View>
      </View>
      {/* Row 3 */}
        <View style={styles.bankRowSmall}>
          <View style={[styles.cell, { width: '20%' }]}>
                <Text style={styles.label}>ИНН</Text>
                <Text style={styles.text}>{seller.inn}</Text>
          </View>
          <View style={[styles.cell, { width: '30%' }]}>
              <Text style={styles.label}>КПП</Text>
              <Text style={styles.text}>{seller.kpp || '—'}</Text>
          </View>
          <View style={[styles.cell, { width: '10%' }]}>
                <Text style={styles.label}>Счёт</Text>
          </View>
            <View style={[styles.cellLast, { width: '40%', alignItems: 'flex-end' }]}>
              <Text style={styles.text}>{seller.accountNumber}</Text>
          </View>
      </View>
      {/* Row 4 */}
        <View style={[styles.row, { borderTopWidth: 0 }]}>
          <View style={[styles.cellLast, { width: '100%' }]}>
              <Text style={styles.label}>Получатель</Text>
              <Text style={[styles.text, styles.bold]}>{seller.name}</Text>
          </View>
      </View>
  </View>
);

const InvoiceInfoSection: React.FC<{ data: InvoiceData }> = ({ data }) => (
  <View style={styles.mb20}>
      <Text style={[styles.h2, styles.mb10]}>Счёт № {data.number} от {formatDate(data.date)}</Text>
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
);

const ItemsTable: React.FC<{ items: InvoiceItem[] }> = ({ items }) => (
  <View style={styles.table}>
      <View style={styles.tableHeader}>
            <Text style={[styles.thCenter, { width: TABLE_COLS.no }]}>№</Text>
            <Text style={[styles.thLeft, { width: TABLE_COLS.name }]}>Название товара (услуги)</Text>
            <Text style={[styles.thCenter, { width: TABLE_COLS.qty }]}>Кол-во</Text>
            <Text style={[styles.thCenter, { width: TABLE_COLS.unit }]}>Ед.</Text>
            <Text style={[styles.thRight, { width: TABLE_COLS.price }]}>Цена</Text>
            <Text style={[styles.thRight, { width: TABLE_COLS.total }]}>Сумма</Text>
      </View>

      {items.map((item, index) => (
          <View key={index} style={styles.tableRow} wrap={false}>
              <Text style={[styles.tdCenter, { width: TABLE_COLS.no }]}>{index + 1}</Text>
              <Text style={[styles.tdLeft, { width: TABLE_COLS.name }]}>{item.name}</Text>
              <Text style={[styles.tdCenter, { width: TABLE_COLS.qty }]}>{item.quantity}</Text>
              <Text style={[styles.tdCenter, { width: TABLE_COLS.unit }]}>шт</Text>
              <Text style={[styles.tdRight, { width: TABLE_COLS.price }]}>{formatCurrency(item.price)}</Text>
              <Text style={[styles.tdRight, styles.bold, { width: TABLE_COLS.total }]}>{formatCurrency(item.price * item.quantity)}</Text>
          </View>
      ))}
  </View>
);

const TotalsSection: React.FC<{ itemsCount: number, total: number, vatAmount: number, vatRate: number }> = ({ itemsCount, total, vatAmount, vatRate }) => (
  <View style={{ marginTop: 20 }} wrap={false}>
      <Text style={styles.mb4}>Всего наименований {itemsCount}, на сумму {formatCurrency(total)}</Text>
      <View style={styles.alignEnd}>
          <View style={[styles.row, styles.mb4, { width: 300, justifyContent: 'flex-end' }]}>
              <Text style={[styles.bold, { marginRight: 10, fontSize: 12 }]}>Итог к оплате:</Text>
              <Text style={[styles.bold, { minWidth: 80, textAlign: 'right', fontSize: 12 }]}>{formatCurrency(total)}</Text>
          </View>
          <View style={[styles.row, { width: 300, justifyContent: 'flex-end' }]}>
                <Text style={styles.label}>{vatRate === -1 ? 'Без НДС' : `В т.ч. НДС ${formatCurrency(vatAmount)}`}</Text>
          </View>
      </View>
  </View>
);

const SignaturesSection: React.FC<{ data: InvoiceData }> = ({ data }) => (
  <View style={styles.signatureSection} wrap={false}>
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
);

export const InvoicePdf: React.FC<PdfDocumentProps> = ({ data }) => {
  const subtotal = data.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  const vatAmount = data.vatRate > 0 ? subtotal * (data.vatRate / 100) : 0;
  const total = subtotal + vatAmount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <InvoiceHeader data={data} total={total} />
        <BankDetailsSection seller={data.seller} />
        <InvoiceInfoSection data={data} />
        <ItemsTable items={data.items} />
        <TotalsSection 
            itemsCount={data.items.length} 
            total={total} 
            vatAmount={vatAmount} 
            vatRate={data.vatRate} 
        />
        <SignaturesSection data={data} />
      </Page>
    </Document>
  );
};
