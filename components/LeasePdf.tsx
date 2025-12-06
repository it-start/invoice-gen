

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Svg, Path, Ellipse } from '@react-pdf/renderer';
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
    // CRITICAL: Increased padding to ensure content doesn't flow behind the fixed signature footer
    paddingBottom: 170, 
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
    paddingVertical: 1,
    paddingHorizontal: 4,
  },
  timeBadgeText: {
    color: '#ffffff',
    fontSize: 8,
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
  
  // --- FIXED FOOTER CONTAINER ---
  fixedFooterContainer: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 150, // Explicit height for the footer area
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  
  // Signature specific styles within footer
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 40,
    marginBottom: 10,
  },
  signatureBlock: {
    flex: 1,
  },
  signatureImage: {
    height: 40,
    width: 100,
    objectFit: 'contain',
    marginBottom: 2
  },
  
  // Metadata line at very bottom
  metadataFooter: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 4,
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

const PdfLogo = () => (
    <Svg width="80" height="24" viewBox="0 0 80 24">
        <Ellipse cx="11.8519" cy="12" rx="2.96296" ry="3" fill="#FF5C00" />
        <Path d="M12.1198 2C12.7148 2 13.0123 2.00002 13.1605 2.19694C13.3087 2.39386 13.2298 2.68429 13.0721 3.26514L12.0568 7.00301C11.9997 7.00103 11.9424 7 11.8848 7C9.15751 7 6.94657 9.23858 6.94657 12C6.94657 13.8894 7.98161 15.5338 9.50886 16.3841L8.16313 21.3389C8.11884 21.502 8.09669 21.5836 8.06089 21.6506C7.97106 21.8187 7.81425 21.9397 7.63032 21.9828C7.55702 22 7.47347 22 7.30641 22C6.02242 22 5.38039 22 4.85528 21.8503C3.53098 21.4728 2.49601 20.4249 2.12315 19.0841C1.97531 18.5524 1.97534 17.9023 1.97534 16.6023V10C1.97534 6.22876 1.97532 4.34312 3.13243 3.17155C4.28954 1.99998 6.1519 2 9.87658 2H12.1198Z" fill="#8263FF" />
        <Path fillRule="evenodd" d="M70.4527 2C74.1774 2 76.0397 1.99998 77.1969 3.17155C78.354 4.34312 78.3539 6.22877 78.3539 10V14C78.3539 17.7712 78.354 19.6569 77.1969 20.8285C76.0397 22 74.1774 22 70.4527 22H11.6663C11.0713 22 10.7738 22 10.6256 21.8031C10.4774 21.6061 10.5562 21.3157 10.714 20.7349L11.7291 16.9974C11.7808 16.999 11.8327 17 11.8848 17C14.6121 17 16.823 14.7614 16.823 12C16.823 10.1165 15.7945 8.47628 14.275 7.6237L15.5364 2.97982C15.6644 2.50854 15.7284 2.27291 15.9052 2.13647C16.082 2.00004 16.3234 2 16.8062 2H70.4527Z" fill="#8263FF" />
        <Path d="M24.4818 16C23.7175 16 23.0554 15.8338 22.4956 15.5014C21.9358 15.169 21.5033 14.7039 21.1983 14.1062C20.8932 13.5052 20.7407 12.8068 20.7407 12.011C20.7407 11.2118 20.8932 10.5118 21.1983 9.91071C21.5033 9.30968 21.9358 8.84295 22.4956 8.51053C23.0554 8.17811 23.7175 8.01191 24.4818 8.01191C25.2461 8.01191 25.9081 8.17811 26.4679 8.51053C27.0278 8.84295 27.4602 9.30968 27.7652 9.91071C28.0703 10.5118 28.2228 11.2118 28.2228 12.011C28.2228 12.8068 28.0703 13.5052 27.7652 14.1062C27.4602 14.7039 27.0278 15.169 26.4679 15.5014C25.9081 15.8338 25.2461 16 24.4818 16ZM24.4918 14.4588C24.8807 14.4588 25.2042 14.3513 25.4623 14.1364C25.7238 13.9182 25.9199 13.6244 26.0506 13.255C26.1813 12.8823 26.2467 12.4643 26.2467 12.0009C26.2467 11.5375 26.1813 11.1212 26.0506 10.7518C25.9199 10.3791 25.7238 10.0836 25.4623 9.86539C25.2042 9.64377 24.8807 9.53297 24.4918 9.53297C24.0963 9.53297 23.7661 9.64377 23.5013 9.86539C23.2398 10.0836 23.0437 10.3791 22.9129 10.7518C22.7856 11.1212 22.7219 11.5375 22.7219 12.0009C22.7219 12.4643 22.7856 12.8823 22.9129 13.255C23.0437 13.6244 23.2398 13.9182 23.5013 14.1364C23.7661 14.3513 24.0963 14.4588 24.4918 14.4588Z" fill="white" />
        <Path d="M31.0663 15.8489L28.9142 8.11264H30.8953L32.1876 13.4565H32.258L33.5905 8.11264H35.5415L36.884 13.4263H36.9544L38.2266 8.11264H40.2077L38.0556 15.8489H36.0141L34.6112 10.7669H34.5107L33.1128 15.8489H31.0663Z" fill="white" />
        <Path d="M43.3818 11.3411V15.8489H41.4359V8.11264H43.2963V9.44734H43.3869C43.5612 9.00748 43.8461 8.65827 44.2417 8.39973C44.6372 8.14118 45.1216 8.01191 45.6948 8.01191C46.2312 8.01191 46.6971 8.12775 47.0927 8.35943C47.4916 8.59112 47.8 8.92354 48.0179 9.35669C48.2391 9.78983 48.3498 10.312 48.3498 10.9231V15.8489H46.3988V11.2454C46.4021 10.7451 46.2748 10.3539 46.0166 10.0719C45.7585 9.78983 45.4032 9.64881 44.9506 9.64881C44.6422 9.64881 44.3707 9.71596 44.1361 9.85028C43.9014 9.98458 43.717 10.1777 43.583 10.4295C43.4522 10.6813 43.3852 10.9852 43.3818 11.3411Z" fill="white" />
        <Path d="M50.1335 15.8489V8.11264H52.0795V15.8489H50.1335ZM51.1141 7.05494C50.8124 7.05494 50.5526 6.95421 50.3347 6.75275C50.1201 6.55128 50.0129 6.30952 50.0129 6.02747C50.0129 5.74542 50.1201 5.50366 50.3347 5.3022C50.5526 5.10073 50.8107 5 51.109 5C51.4141 5 51.6722 5.10073 51.8834 5.3022C52.0979 5.50366 52.2052 5.74542 52.2052 6.02747C52.2052 6.30952 52.0979 6.55128 51.8834 6.75275C51.6722 6.95421 51.4158 7.05494 51.1141 7.05494Z" fill="white" />
        <Path d="M53.8947 15.8489V8.11264H55.7552V9.44734H55.8457C56.0066 9.00076 56.2731 8.64988 56.6452 8.39469C57.0173 8.1395 57.4631 8.01191 57.9827 8.01191C58.509 8.01191 58.9548 8.14118 59.3202 8.39973C59.6856 8.65491 59.937 9.00412 60.0745 9.44734H60.1549C60.3192 9.01084 60.6058 8.66331 61.0148 8.40476C61.4271 8.14286 61.9148 8.01191 62.478 8.01191C63.192 8.01191 63.7736 8.23855 64.2228 8.69185C64.672 9.14515 64.8966 9.79823 64.8966 10.6511V15.8489H62.9506V10.9886C62.9506 10.5285 62.8283 10.1894 62.5836 9.97115C62.3389 9.74954 62.0372 9.63874 61.6785 9.63874C61.2595 9.63874 60.9326 9.77137 60.698 10.0366C60.4633 10.2985 60.346 10.641 60.346 11.0641V15.8489H58.4453V10.9281C58.4453 10.5353 58.3297 10.223 58.0984 9.9913C57.867 9.75626 57.5653 9.63874 57.1933 9.63874C56.9418 9.63874 56.7139 9.70253 56.5094 9.83013C56.3049 9.95772 56.1423 10.1374 56.0217 10.369C55.901 10.5974 55.8407 10.8643 55.8407 11.1699V15.8489H53.8947Z" fill="white" />
        <Path d="M68.8978 16C68.4084 16 67.9693 15.9127 67.5804 15.7381C67.1916 15.5635 66.8849 15.3049 66.6603 14.9625C66.4357 14.6166 66.3234 14.1902 66.3234 13.6832C66.3234 13.25 66.4021 12.889 66.5597 12.6003C66.7206 12.3115 66.9385 12.0798 67.2134 11.9052C67.4883 11.7306 67.8 11.5997 68.1486 11.5124C68.4973 11.4217 68.861 11.3562 69.2398 11.3159C69.6923 11.2689 70.0577 11.227 70.3359 11.19C70.6142 11.1497 70.817 11.0876 70.9444 11.0037C71.0717 10.9197 71.1354 10.7921 71.1354 10.6209V10.5907C71.1354 10.2381 71.0282 9.96444 70.8136 9.76969C70.5991 9.57494 70.2924 9.47756 69.8934 9.47756C69.4711 9.47756 69.1358 9.5699 68.8878 9.75458C68.6431 9.93926 68.4788 10.1609 68.395 10.4194L66.5798 10.2129C66.7005 9.74283 66.9117 9.34325 67.2134 9.01419C67.5184 8.68513 67.8972 8.43666 68.3498 8.26877C68.8057 8.09753 69.3185 8.01191 69.8884 8.01191C70.284 8.01191 70.6712 8.05891 71.0499 8.15293C71.4287 8.24359 71.7707 8.39133 72.0757 8.59615C72.3841 8.80098 72.6288 9.07296 72.8098 9.41209C72.9942 9.74786 73.0864 10.1625 73.0864 10.6561V15.8489H71.2209V14.7811H71.1606C71.0466 15.0061 70.8874 15.2126 70.6829 15.4006C70.4818 15.5853 70.232 15.7314 69.9337 15.8388C69.6387 15.9463 69.2934 16 68.8978 16ZM69.4258 14.6049C69.7711 14.6049 70.0728 14.536 70.3309 14.3984C70.589 14.2607 70.7885 14.076 70.9293 13.8443C71.0734 13.6126 71.1455 13.3574 71.1455 13.0788V12.2024C71.0851 12.2494 70.9896 12.2914 70.8589 12.3283C70.7315 12.3652 70.589 12.3988 70.4315 12.429C70.2739 12.4592 70.1164 12.4861 69.9588 12.5096C69.8046 12.5331 69.6672 12.5533 69.5465 12.5701C69.285 12.607 69.052 12.6674 68.8476 12.7514C68.6431 12.832 68.4822 12.9444 68.3648 13.0888C68.2509 13.2332 68.1939 13.4162 68.1939 13.6378C68.1939 13.9534 68.3095 14.1935 68.5408 14.3581C68.7721 14.5226 69.0671 14.6049 69.4258 14.6049Z" fill="white" />
    </Svg>
);

export const LeasePdf: React.FC<LeasePdfProps> = ({ data }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={[styles.row, styles.justifyBetween, styles.mb10]}>
            <View>
                <PdfLogo />
                <Text style={[styles.title, { marginTop: 4 }]}>Lease agreement</Text>
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
                {data.pickup.fee > 0 && (
                    <View style={styles.pricingRow}>
                        <Text style={styles.text}>Pick-up fee</Text>
                        <Text style={styles.text}>{data.pickup.fee} THB</Text>
                    </View>
                )}
                {data.dropoff.fee > 0 && (
                    <View style={styles.pricingRow}>
                        <Text style={styles.text}>Return fee</Text>
                        <Text style={styles.text}>{data.dropoff.fee} THB</Text>
                    </View>
                )}
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

        {/* --- FIXED FOOTER (Signatures + Meta) --- */}
        <View fixed style={styles.fixedFooterContainer}>
            
            {/* Signatures */}
            <View style={styles.signatureSection}>
                <View style={styles.signatureBlock}>
                    <Text style={styles.h3}>{data.owner.surname}</Text>
                    <Text style={styles.label}>{data.owner.contact}</Text>
                    <Text style={styles.label}>{data.owner.address}</Text>

                    <View style={{ marginTop: 15 }}>
                        <Text style={[styles.h3, { fontSize: 9 }]}>Owner (Lessor)</Text>
                        {data.owner.signature ? (
                           <Image src={data.owner.signature} style={styles.signatureImage} />
                        ) : (
                           <View style={{ height: 42 }} /> // Spacer
                        )}
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
                         {data.renter.signature ? (
                           <Image src={data.renter.signature} style={styles.signatureImage} />
                        ) : (
                           <View style={{ height: 42 }} /> // Spacer
                        )}
                        <View style={styles.borderBottom} />
                        <Text style={[styles.label, { marginTop: 2, textAlign: 'left' }]}>Date, signature</Text>
                    </View>
                </View>
            </View>

            {/* Meta Line */}
            <View style={styles.metadataFooter}>
                <Text style={styles.footerText}>
                    {data.reservationId} • {data.vehicle.name} • {data.vehicle.plate}
                </Text>
                <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
                    `${pageNumber} / ${totalPages}`
                )} />
            </View>

        </View>

      </Page>
    </Document>
  );
};