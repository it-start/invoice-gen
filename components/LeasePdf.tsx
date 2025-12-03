
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { LeaseData } from '../types';
import { registerFonts, pdfStyles } from '../styles/pdfStyles';

// Use shared font registration
registerFonts();

const styles = StyleSheet.create({
  ...pdfStyles, // Inherit shared styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 30,
  },
  metaLabel: {
    fontSize: 8,
    color: '#666',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 10,
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
  qrText: {
    fontSize: 8,
    color: '#ccc',
  },
  vehicleSection: {
    marginBottom: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  vehicleDetails: {
    fontSize: 8,
    color: '#666',
    textTransform: 'uppercase',
  },
  dateContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginBottom: 20,
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
  dateLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  dateLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#666',
    textTransform: 'uppercase',
  },
  dateSubLabel: {
    fontSize: 8,
    color: '#999',
  },
  dateValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  dateValueBig: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateValueSmall: {
    fontSize: 10,
    color: '#444',
  },
  pricingContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 20,
  },
  pricingCol: {
    flex: 1,
  },
  pricingTitle: {
    fontSize: 8,
    color: '#999',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 2,
  },
  totalBlocks: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  totalBox: {
    flex: 1,
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  totalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  totalTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalNote: {
    fontSize: 8,
    color: '#666',
  },
  termsContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 10,
    marginBottom: 20,
  },
  termsText: {
    fontSize: 7,
    color: '#444',
    lineHeight: 1.5,
  },
  signaturesContainer: {
    flexDirection: 'row',
    gap: 40,
  },
  sigCol: {
    flex: 1,
  },
  sigName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  sigDetail: {
    fontSize: 8,
    color: '#666',
    marginBottom: 1,
  },
  sigBlock: {
    marginTop: 20,
  },
  sigLine: {
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginBottom: 2,
  },
  sigDate: {
    fontSize: 8,
    color: '#999',
  }
});

interface LeasePdfProps {
  data: LeaseData;
}

export const LeasePdf: React.FC<LeasePdfProps> = ({ data }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
            <View>
                <Text style={styles.title}>Lease agreement</Text>
                <View style={styles.metaRow}>
                    <View>
                        <Text style={styles.metaLabel}>Reservation ID</Text>
                        <Text style={styles.metaValue}>{data.reservationId}</Text>
                    </View>
                    <View>
                        <Text style={styles.metaLabel}>Source</Text>
                        <Text style={styles.metaValue}>{data.source}</Text>
                    </View>
                    <View>
                        <Text style={styles.metaLabel}>Created on</Text>
                        <Text style={styles.metaValue}>{data.createdDate}</Text>
                    </View>
                </View>
            </View>
            <View style={styles.qrPlaceholder}>
                {data.qrCodeUrl ? (
                    <Image src={data.qrCodeUrl} style={{ width: '100%', height: '100%' }} />
                ) : (
                    <Text style={styles.qrText}>[QR]</Text>
                )}
            </View>
        </View>

        {/* Vehicle */}
        <View style={styles.vehicleSection}>
            <Text style={styles.vehicleName}>{data.vehicle.name}</Text>
            <Text style={styles.vehicleDetails}>{data.vehicle.details} • {data.vehicle.plate}</Text>
        </View>

        {/* Dates */}
        <View style={styles.dateContainer}>
            <View style={styles.dateBox}>
                <View style={styles.dateLabelRow}>
                    <Text style={styles.dateLabel}>Pick-up</Text>
                    <Text style={styles.dateSubLabel}>Default pick-up</Text>
                </View>
                <View style={styles.dateValueRow}>
                    <Text style={styles.dateValueBig}>{data.pickup.date}</Text>
                    <Text style={styles.dateValueSmall}>{data.pickup.time}</Text>
                </View>
            </View>
            <View style={[styles.dateBox, styles.dateBoxRight]}>
                <View style={styles.dateLabelRow}>
                    <Text style={styles.dateLabel}>Return</Text>
                    <Text style={styles.dateSubLabel}>Default return</Text>
                </View>
                <View style={styles.dateValueRow}>
                     <Text style={styles.dateValueBig}>{data.dropoff.date}</Text>
                     <Text style={styles.dateValueSmall}>{data.dropoff.time}</Text>
                </View>
            </View>
        </View>

        {/* Pricing */}
        <View style={styles.pricingContainer}>
            <View style={styles.pricingCol}>
                <Text style={styles.pricingTitle}>Rental Cost</Text>
                <View style={styles.pricingRow}>
                    <Text>Regular price ({data.pricing.daysRegular} days)</Text>
                    <Text>{data.pricing.priceRegular} THB</Text>
                </View>
                <View style={styles.pricingRow}>
                    <Text>Season price ({data.pricing.daysSeason} days)</Text>
                    <Text>{data.pricing.priceSeason} THB</Text>
                </View>
            </View>
             <View style={styles.pricingCol}>
                <Text style={styles.pricingTitle}>Extra Options</Text>
                 {data.extraOptions.map((opt, i) => (
                    <View key={i} style={styles.pricingRow}>
                        <Text>{opt.name}</Text>
                        <Text>{opt.price} THB</Text>
                    </View>
                 ))}
            </View>
        </View>

        {/* Totals */}
        <View style={styles.totalBlocks}>
            <View style={[styles.totalBox, { backgroundColor: '#f9f9f9' }]}>
                <View style={styles.totalHeader}>
                    <Text style={styles.totalTitle}>Deposit</Text>
                    <Text style={styles.totalAmount}>{data.pricing.deposit} THB</Text>
                </View>
                <Text style={styles.totalNote}>Return at the end of the rental period</Text>
            </View>
            <View style={[styles.totalBox, { backgroundColor: '#eee' }]}>
                 <View style={styles.totalHeader}>
                    <Text style={styles.totalTitle}>Total price</Text>
                    <Text style={styles.totalAmount}>{data.pricing.total} THB</Text>
                </View>
                <Text style={styles.totalNote}>Paid separately</Text>
            </View>
        </View>

        {/* Terms */}
        <View style={styles.termsContainer}>
             <Text style={styles.termsText}>{data.terms}</Text>
        </View>

        {/* Signatures */}
        <View style={styles.signaturesContainer}>
            <View style={styles.sigCol}>
                <Text style={styles.sigName}>{data.owner.surname}</Text>
                <Text style={styles.sigDetail}>{data.owner.contact}</Text>
                <Text style={styles.sigDetail}>{data.owner.address}</Text>

                <View style={styles.sigBlock}>
                    <Text style={[styles.sigName, {marginBottom: 10}]}>Owner (Lessor)</Text>
                    <View style={styles.sigLine} />
                    <Text style={styles.sigDate}>Date, signature</Text>
                </View>
            </View>
            <View style={styles.sigCol}>
                <Text style={styles.sigName}>{data.renter.surname}</Text>
                <Text style={styles.sigDetail}>{data.renter.contact}</Text>
                <Text style={styles.sigDetail}>Passport: {data.renter.passport}</Text>
                
                 <View style={styles.sigBlock}>
                    <Text style={[styles.sigName, {marginBottom: 10}]}>Rider (Tenant)</Text>
                    <View style={styles.sigLine} />
                    <Text style={styles.sigDate}>Date, signature</Text>
                </View>
            </View>
        </View>

      </Page>
    </Document>
  );
};
