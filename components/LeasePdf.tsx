
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { LeaseData } from '../types';
import { registerFonts, pdfStyles } from '../styles/pdfStyles';

// Use shared font registration
registerFonts();

const styles = StyleSheet.create({
  ...pdfStyles, // Inherit shared styles
  
  // Custom styles for Lease specific elements
  metaRow: {
    flexDirection: 'row',
    gap: 30,
    marginTop: 5,
  },
  qrPlaceholder: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dateBox: {
    flex: 1,
    padding: 10,
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
});

interface LeasePdfProps {
  data: LeaseData;
}

export const LeasePdf: React.FC<LeasePdfProps> = ({ data }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={[styles.row, styles.justifyBetween, styles.mb20]}>
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
        <View style={[styles.mb20, { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 15 }]}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>{data.vehicle.name}</Text>
            <Text style={styles.label}>{data.vehicle.details} • {data.vehicle.plate}</Text>
        </View>

        {/* Dates */}
        <View style={[styles.box, styles.row, styles.mb20]}>
            <View style={styles.dateBox}>
                <View style={[styles.row, styles.justifyBetween, styles.mb4]}>
                    <Text style={styles.label}>Pick-up</Text>
                    <Text style={[styles.small, { color: '#999' }]}>Default pick-up</Text>
                </View>
                <View style={[styles.row, styles.justifyBetween, styles.alignEnd]}>
                    <Text style={styles.h3}>{data.pickup.date}</Text>
                    <Text style={styles.text}>{data.pickup.time}</Text>
                </View>
            </View>
            <View style={[styles.dateBox, styles.dateBoxRight]}>
                 <View style={[styles.row, styles.justifyBetween, styles.mb4]}>
                    <Text style={styles.label}>Return</Text>
                    <Text style={[styles.small, { color: '#999' }]}>Default return</Text>
                </View>
                <View style={[styles.row, styles.justifyBetween, styles.alignEnd]}>
                     <Text style={styles.h3}>{data.dropoff.date}</Text>
                     <Text style={styles.text}>{data.dropoff.time}</Text>
                </View>
            </View>
        </View>

        {/* Pricing */}
        <View style={[styles.row, styles.mb20, { gap: 20 }]}>
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
        <View style={[styles.row, styles.mb20, { gap: 15 }]}>
            <View style={[styles.box, styles.p10, styles.flex1, { backgroundColor: '#f9f9f9' }]}>
                <View style={[styles.row, styles.justifyBetween, styles.alignBase, styles.mb4]}>
                    <Text style={styles.h3}>Deposit</Text>
                    <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{data.pricing.deposit} THB</Text>
                </View>
                <Text style={[styles.small, { color: '#666' }]}>Return at the end of the rental period</Text>
            </View>
            <View style={[styles.box, styles.p10, styles.flex1, { backgroundColor: '#eee' }]}>
                 <View style={[styles.row, styles.justifyBetween, styles.alignBase, styles.mb4]}>
                    <Text style={styles.h3}>Total price</Text>
                    <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{data.pricing.total} THB</Text>
                </View>
                <Text style={[styles.small, { color: '#666' }]}>Paid separately</Text>
            </View>
        </View>

        {/* Terms */}
        <View style={[styles.mb20, { borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#ddd', paddingVertical: 10 }]}>
             <Text style={[styles.text, { fontSize: 7, lineHeight: 1.5, color: '#444' }]}>{data.terms}</Text>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
            <View style={styles.signatureBlock}>
                <Text style={styles.h3}>{data.owner.surname}</Text>
                <Text style={styles.label}>{data.owner.contact}</Text>
                <Text style={styles.label}>{data.owner.address}</Text>

                <View style={{ marginTop: 20 }}>
                    <Text style={[styles.h3, styles.mb10]}>Owner (Lessor)</Text>
                    <View style={styles.borderBottom} />
                    <Text style={[styles.label, { marginTop: 4, textAlign: 'left' }]}>Date, signature</Text>
                </View>
            </View>
            <View style={styles.signatureBlock}>
                <Text style={styles.h3}>{data.renter.surname}</Text>
                <Text style={styles.label}>{data.renter.contact}</Text>
                <Text style={styles.label}>Passport: {data.renter.passport}</Text>
                
                 <View style={{ marginTop: 20 }}>
                    <Text style={[styles.h3, styles.mb10]}>Rider (Tenant)</Text>
                    <View style={styles.borderBottom} />
                    <Text style={[styles.label, { marginTop: 4, textAlign: 'left' }]}>Date, signature</Text>
                </View>
            </View>
        </View>

      </Page>
    </Document>
  );
};
