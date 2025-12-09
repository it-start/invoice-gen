
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Svg, Path, Ellipse } from '@react-pdf/renderer';
import { Asset, BookingV2 } from '../../types';
import { DOMAIN_TERMS } from '../../utils/domainTerms';
import { registerFonts, pdfStyles } from '../../styles/pdfStyles';

registerFonts();

const styles = StyleSheet.create({
  ...pdfStyles,
  page: {
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 10,
    color: '#111',
    lineHeight: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  section: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: '30%',
    color: '#64748b',
    fontSize: 9,
  },
  value: {
    width: '70%',
    fontWeight: 'bold',
    fontSize: 10,
  },
  datesContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  dateBox: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
  },
  dateLabel: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalSection: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 10,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  terms: {
    fontSize: 8,
    color: '#475569',
    textAlign: 'justify',
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureLine: {
    width: '45%',
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 5,
    marginTop: 40,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#64748b',
  }
});

interface ContractPdfV2Props {
  asset: Asset;
  booking: BookingV2;
}

const PdfLogo = () => (
    <Svg width="80" height="24" viewBox="0 0 80 24">
        <Ellipse cx="11.8519" cy="12" rx="2.96296" ry="3" fill="#FF5C00" />
        <Path d="M12.1198 2C12.7148 2 13.0123 2.00002 13.1605 2.19694C13.3087 2.39386 13.2298 2.68429 13.0721 3.26514L12.0568 7.00301C11.9997 7.00103 11.9424 7 11.8848 7C9.15751 7 6.94657 9.23858 6.94657 12C6.94657 13.8894 7.98161 15.5338 9.50886 16.3841L8.16313 21.3389C8.11884 21.502 8.09669 21.5836 8.06089 21.6506C7.97106 21.8187 7.81425 21.9397 7.63032 21.9828C7.55702 22 7.47347 22 7.30641 22C6.02242 22 5.38039 22 4.85528 21.8503C3.53098 21.4728 2.49601 20.4249 2.12315 19.0841C1.97531 18.5524 1.97534 17.9023 1.97534 16.6023V10C1.97534 6.22876 1.97532 4.34312 3.13243 3.17155C4.28954 1.99998 6.1519 2 9.87658 2H12.1198Z" fill="#8263FF" />
        <Path fillRule="evenodd" d="M70.4527 2C74.1774 2 76.0397 1.99998 77.1969 3.17155C78.354 4.34312 78.3539 6.22877 78.3539 10V14C78.3539 17.7712 78.354 19.6569 77.1969 20.8285C76.0397 22 74.1774 22 70.4527 22H11.6663C11.0713 22 10.7738 22 10.6256 21.8031C10.4774 21.6061 10.5562 21.3157 10.714 20.7349L11.7291 16.9974C11.7808 16.999 11.8327 17 11.8848 17C14.6121 17 16.823 14.7614 16.823 12C16.823 10.1165 15.7945 8.47628 14.275 7.6237L15.5364 2.97982C15.6644 2.50854 15.7284 2.27291 15.9052 2.13647C16.082 2.00004 16.3234 2 16.8062 2H70.4527Z" fill="#8263FF" />
    </Svg>
);

export const ContractPdfV2: React.FC<ContractPdfV2Props> = ({ asset, booking }) => {
  const terms = DOMAIN_TERMS[asset.domainType];
  const attributes = asset.attributes as Record<string, any>;

  // Helper to extract relevant ID based on domain
  const getAssetIdentifier = () => {
    if (asset.domainType === 'vehicle') return attributes.plate;
    if (asset.domainType === 'property') return attributes.address;
    if (asset.domainType === 'equipment') return attributes.serialNumber;
    return asset.id;
  };

  const getAttributeRow = (label: string, key: string) => {
      if (!attributes[key]) return null;
      return (
        <View style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{attributes[key]}</Text>
        </View>
      );
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
            <View>
                <Text style={styles.title}>{terms.contractTitle}</Text>
                <Text style={styles.subtitle}>ID: {booking.id}</Text>
            </View>
            <PdfLogo />
        </View>

        {/* 1. Subject of Agreement */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. {terms.assetLabel} Details</Text>
            <View style={styles.row}>
                <Text style={styles.label}>Name / Model</Text>
                <Text style={styles.value}>{asset.name}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>{terms.idLabel}</Text>
                <Text style={styles.value}>{getAssetIdentifier() || 'N/A'}</Text>
            </View>
            
            {/* Dynamic Attributes */}
            {asset.domainType === 'vehicle' && (
                <>
                    {getAttributeRow('VIN', 'vin')}
                    {getAttributeRow('Fuel Type', 'fuelType')}
                </>
            )}
            {asset.domainType === 'property' && (
                <>
                    {getAttributeRow('Bedrooms', 'bedrooms')}
                    {getAttributeRow('Area', 'area')}
                </>
            )}
        </View>

        {/* 2. Term of Agreement */}
        <Text style={styles.sectionTitle}>2. Rental Period</Text>
        <View style={styles.datesContainer}>
            <View style={styles.dateBox}>
                <Text style={styles.dateLabel}>{terms.startLabel}</Text>
                <Text style={styles.dateValue}>{booking.startDatetime.split('T')[0]}</Text>
            </View>
            <View style={styles.dateBox}>
                <Text style={styles.dateLabel}>{terms.endLabel}</Text>
                <Text style={styles.dateValue}>{booking.endDatetime.split('T')[0]}</Text>
            </View>
        </View>

        {/* 3. Financials */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Financial Terms</Text>
            <View style={styles.row}>
                <Text style={styles.label}>{terms.customerLabel}</Text>
                <Text style={styles.value}>{booking.userId}</Text>
            </View>
            
            <View style={styles.totalSection}>
                <Text style={styles.totalLabel}>Total Payable:</Text>
                <Text style={styles.totalValue}>{booking.pricing.totalAmount.toLocaleString()} {booking.pricing.currencyCode}</Text>
            </View>
        </View>

        {/* Standard Clause */}
        <Text style={styles.terms}>
            This {terms.contractTitle} is made and entered into by and between the {terms.providerLabel} and the {terms.customerLabel}. 
            The {terms.providerLabel} agrees to rent the {terms.assetLabel} described above to the {terms.customerLabel} for the specified period.
            The {terms.customerLabel} agrees to pay the total amount and return the {terms.assetLabel} in the same condition as received.
            {asset.domainType === 'vehicle' ? ' The vehicle must be returned with the same fuel level.' : ''}
            {asset.domainType === 'property' ? ' The property must be vacated by the check-out time.' : ''}
        </Text>

        {/* Signatures */}
        <View style={styles.footer}>
            <View style={styles.signatureLine}>
                <Text style={styles.signatureLabel}>{terms.providerLabel} Signature</Text>
            </View>
            <View style={styles.signatureLine}>
                <Text style={styles.signatureLabel}>{terms.customerLabel} Signature</Text>
            </View>
        </View>

      </Page>
    </Document>
  );
};
