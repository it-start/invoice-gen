
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { LeaseData } from '../types';
import { registerFonts, pdfStyles } from '../styles/pdfStyles';

// Use shared font registration
registerFonts();

const styles = StyleSheet.create({
  ...pdfStyles, // Inherit shared styles
  
  // OVERRIDES FOR COMPACT SINGLE-PAGE LAYOUT
  page: {
    paddingTop: 20,
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 40, // Increased bottom padding to make room for footer
    fontFamily: 'Roboto',
    fontSize: 9,
    color: '#111',
    lineHeight: 1.25,
  },
  
  // Typography Overrides
  title: {
      fontSize: 16, // Reduced from 20
      fontWeight: 'bold',
      marginBottom: 4,
  },
  h3: {
      fontSize: 10,
      fontWeight: 'bold',
      marginBottom: 2,
  },
  text: {
      fontSize: 9,
  },
  label: {
      fontSize: 7,
      color: '#666',
      marginBottom: 1,
      textTransform: 'uppercase',
  },
  small: {
      fontSize: 7,
  },

  // Spacing Overrides
  mb4: { marginBottom: 2 },
  mb10: { marginBottom: 6 },
  mb20: { marginBottom: 10 },
  p10: { padding: 6 },

  // Custom styles for Lease specific elements
  metaRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 2,
  },
  qrPlaceholder: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dateBox: {
    flex: 1,
    padding: 6,
  },
  dateBoxRight: {
    borderLeftWidth: 1,
    borderLeftColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 2,
  },
  // Time badge style
  timeBadge: {
    backgroundColor: '#000000',
    // borderRadius: 3,
    paddingVertical: 1,
    paddingHorizontal: 4,
  },
  timeBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    // fontWeight: 'bold',
  },
  // Terms Text
  termsBox: {
    marginBottom: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 6,
  },
  termsText: {
    fontSize: 6.5,
    lineHeight: 1.3,
    color: '#333',
    textAlign: 'justify',
  },
  // Fixed Footer
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 20,
    right: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7,
    color: '#999',
  }
});

interface LeasePdfProps {
  data: LeaseData;
}

const TimeDisplay = ({ time }: { time: string }) => {
    const isSpecial = time && (time.includes('(Early)') || time.includes('(Late)'));
    
    if (isSpecial) {
        return (
            <View style={styles.timeBadge}>
                <Text style={styles.timeBadgeText}>{time}</Text>
            </View>
        );
    }
    
    return <Text style={styles.text}>{time}</Text>;
};

export const LeasePdf: React.FC<LeasePdfProps> = ({ data }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={[styles.row, styles.justifyBetween, styles.mb10]}>
            <View>
                <Text style={styles.title}>Lease agreement</Text>
                <View style={styles.metaRow}>
                    <View>
                        <Text style={styles.label}>Reservation ID</Text>
                        <Text style={styles.text}>{data.reservationId}</Text>
                    </View>
                    <View>
                        <Text style={styles.label}>Source</Text>
                        <Text style={styles.text}>{data.source}</Text>
                    </View>
                    <View>
                        <Text style={styles.label}>Created on</Text>
                        <Text style={styles.text}>{data.createdDate}</Text>
                    </View>
                </View>
            </View>
            <View style={styles.qrPlaceholder}>
                {data.qrCodeUrl ? (
                    <Image src={data.qrCodeUrl} style={{ width: '100%', height: '100%' }} />
                ) : (
                    <Text style={{ fontSize: 8, color: '#ccc' }}>[QR]</Text>
                )}
            </View>
        </View>

        {/* Vehicle */}
        <View style={[styles.mb10, { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 6 }]}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 2 }}>{data.vehicle.name}</Text>
            <Text style={styles.label}>{data.vehicle.details} • {data.vehicle.plate}</Text>
        </View>

        {/* Dates */}
        <View style={[styles.box, styles.row, styles.mb10]}>
            <View style={styles.dateBox}>
                <View style={[styles.row, styles.justifyBetween, styles.mb4]}>
                    <Text style={styles.label}>Pick-up</Text>
                    <Text style={[styles.small, { color: '#999' }]}>Default pick-up</Text>
                </View>
                <View style={[styles.row, styles.justifyBetween, styles.alignCenter]}>
                    <Text style={styles.h3}>{data.pickup.date}</Text>
                    <TimeDisplay time={data.pickup.time} />
                </View>
            </View>
            <View style={[styles.dateBox, styles.dateBoxRight]}>
                 <View style={[styles.row, styles.justifyBetween, styles.mb4]}>
                    <Text style={styles.label}>Return</Text>
                    <Text style={[styles.small, { color: '#999' }]}>Default return</Text>
                </View>
                <View style={[styles.row, styles.justifyBetween, styles.alignCenter]}>
                     <Text style={styles.h3}>{data.dropoff.date}</Text>
                     <TimeDisplay time={data.dropoff.time} />
                </View>
            </View>
        </View>

        {/* Pricing */}
        <View style={[styles.row, styles.mb10, { gap: 15 }]}>
            <View style={styles.flex1}>
                <Text style={styles.label}>Rental Cost</Text>
                <View style={styles.pricingRow}>
                    <Text style={styles.text}>Regular price ({data.pricing.daysRegular} days)</Text>
                    <Text style={styles.text}>{data.pricing.priceRegular} THB</Text>
                </View>
                <View style={styles.pricingRow}>
                    <Text style={styles.text}>Season price ({data.pricing.daysSeason} days)</Text>
                    <Text style={styles.text}>{data.pricing.priceSeason} THB</Text>
                </View>
            </View>
             <View style={styles.flex1}>
                <Text style={styles.label}>Extra Options</Text>
                 {data.extraOptions.map((opt, i) => (
                    <View key={i} style={styles.pricingRow}>
                        <Text style={styles.text}>{opt.name}</Text>
                        <Text style={styles.text}>{opt.price} THB</Text>
                    </View>
                 ))}
            </View>
        </View>

        {/* Totals */}
        <View style={[styles.row, styles.mb10, { gap: 10 }]}>
            <View style={[styles.box, styles.p10, styles.flex1, { backgroundColor: '#f9f9f9' }]}>
                <View style={[styles.row, styles.justifyBetween, styles.alignBase, styles.mb4]}>
                    <Text style={styles.h3}>Deposit</Text>
                    <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{data.pricing.deposit} THB</Text>
                </View>
                <Text style={[styles.small, { color: '#666' }]}>Return at end of rental</Text>
            </View>
            <View style={[styles.box, styles.p10, styles.flex1, { backgroundColor: '#eee' }]}>
                 <View style={[styles.row, styles.justifyBetween, styles.alignBase, styles.mb4]}>
                    <Text style={styles.h3}>Total price</Text>
                    <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{data.pricing.total} THB</Text>
                </View>
                <Text style={[styles.small, { color: '#666' }]}>Paid separately</Text>
            </View>
        </View>

        {/* Terms */}
        <View style={styles.termsBox}>
             <Text style={styles.termsText}>{data.terms}</Text>
        </View>

        {/* Signatures */}
        <View style={[styles.signatureSection, { marginTop: 10 }]}>
            <View style={styles.signatureBlock}>
                <Text style={styles.h3}>{data.owner.surname}</Text>
                <Text style={styles.label}>{data.owner.contact}</Text>
                <Text style={styles.label}>{data.owner.address}</Text>

                <View style={{ marginTop: 15 }}>
                    <Text style={[styles.h3, { fontSize: 9 }]}>Owner (Lessor)</Text>
                    <View style={styles.borderBottom} />
                    <Text style={[styles.label, { marginTop: 2, textAlign: 'left' }]}>Date, signature</Text>
                </View>
            </View>
            <View style={styles.signatureBlock}>
                <Text style={styles.h3}>{data.renter.surname}</Text>
                <Text style={styles.label}>{data.renter.contact}</Text>
                <Text style={styles.label}>Passport: {data.renter.passport}</Text>
                
                 <View style={{ marginTop: 15 }}>
                    <Text style={[styles.h3, { fontSize: 9 }]}>Rider (Tenant)</Text>
                    <View style={styles.borderBottom} />
                    <Text style={[styles.label, { marginTop: 2, textAlign: 'left' }]}>Date, signature</Text>
                </View>
            </View>
        </View>

        {/* Fixed Footer (Colontitul) */}
        <View fixed style={styles.footer}>
            <Text style={styles.footerText}>
                {data.reservationId} • {data.vehicle.name} • {data.vehicle.plate}
            </Text>
            <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
                `${pageNumber} / ${totalPages}`
            )} />
        </View>

      </Page>
    </Document>
  );
};
